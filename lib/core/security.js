import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import glob from 'fast-glob'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function runSecurityCheck({ denyList = [], requireApprovals = false }) {
  const root = path.resolve(process.cwd(), '.dokugent')
  const files = await glob([
    'plan/**/*.yaml',
    'criteria/**/*.yaml',
    'agent-tools/**/*.yaml',
    'plan/**/*.md',
    'criteria/**/*.md',
    'agent-tools/**/*.md'
  ], {
    cwd: root,
    absolute: true,
    ignore: ['**/*-20??-??-??T*.*']
  })

  const blacklistPath = path.join(__dirname, '../security/blacklist.txt')
  let externalPatterns = []

  if (await fs.pathExists(blacklistPath)) {
    const raw = await fs.readFile(blacklistPath, 'utf8')
    externalPatterns = raw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const match = line.match(/^\[(HIGH|MEDIUM|LOW)\]\s+(.*)/i)
        if (match) {
          return { severity: match[1].toUpperCase(), pattern: new RegExp(match[2], 'i') }
        }
        return { severity: 'MEDIUM', pattern: new RegExp(line, 'i') }
      })
  }

  const whitelistPath = path.join(process.cwd(), '.dokugent/security/whitelist.txt')
  let whitelist = []

  if (await fs.pathExists(whitelistPath)) {
    const raw = await fs.readFile(whitelistPath, 'utf8')
    whitelist = raw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
  }

  const defaultDeny = ['exec', 'autoApprove', 'uses: shell', 'model: open-unvetted']
  const denyPatterns = [...defaultDeny, ...denyList]

  const sensitivePatterns = [
    /api[_-]?key\s*:/i,
    /secret\s*:/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /gh[pousr]_[a-zA-Z0-9]{30,}/,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/ // JWTs
  ]

  let issues = 0
  const results = {}

  for (const file of files) {
    const relPath = path.relative(root, file)
    results[relPath] = {
      passed: true,
      blacklistHits: [],
      whitelistHits: [],
      secrets: [],
      approvals: true
    }

    const content = await fs.readFile(file, 'utf8')
    let parsed = {}

    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      try {
        parsed = yaml.load(content)
      } catch (e) {
        console.warn(`⚠️  Skipping unreadable YAML: ${file}`)
      }
    }

    const lines = content.split('\n')

    // Check for deny patterns (line-aware)
    for (const [i, line] of lines.entries()) {
      for (const pattern of denyPatterns) {
        if (line.includes(pattern)) {
          console.warn(`🚫 Found denied pattern "${pattern}" in ${path.basename(file)} (line ${i + 1})`)
          results[relPath].blacklistHits.push({
            line: i + 1,
            term: pattern,
            code: line.trim()
          })
          results[relPath].passed = false
          issues++
        }
      }
    }

    // Check for sensitive keys
    for (const [i, line] of lines.entries()) {
      for (const regex of sensitivePatterns) {
        if (regex.test(line)) {
          console.warn(`🔐 Possible secret in ${path.basename(file)} (line ${i + 1})`)
          results[relPath].secrets.push({
            line: i + 1,
            code: line.trim() || '[empty line]'
          })
          results[relPath].passed = false
          issues++
        }
      }
      for (const { pattern, severity } of externalPatterns) {
        if (pattern.test(line)) {
          const isWhitelisted = whitelist.some(w => line.includes(w))
          if (isWhitelisted) {
            console.warn(`⚠️ Whitelisted: ${pattern} at line ${i + 1} in ${path.basename(file)}`)
            results[relPath].whitelistHits.push({
              line: i + 1,
              term: pattern.source || '[pattern]',
              code: line.trim() || '[empty line]'
            })
            return
          }

          console.warn(`💥 [${severity}] Match in ${path.basename(file)} (line ${i + 1}): ${pattern}`)
          results[relPath].blacklistHits.push({
            line: i + 1,
            term: pattern.source || '[pattern]',
            code: line.trim() || '[empty line]',
            severity
          })
          results[relPath].passed = false
          issues++
        }
      }
    }

    // Check for approval metadata
    if (requireApprovals && (!parsed?.approved_by || !parsed?.approved_at)) {
      console.warn(`⚠️  Missing approval metadata in ${path.basename(file)}`)
      results[relPath].approvals = false
      results[relPath].passed = false
      issues++
    }
  }

  if (issues === 0) {
    console.log('✅ No security issues detected.')
  } else {
    console.log(`🔎 Review complete: ${issues} potential issue(s) found.`)
  }

  return results
}
