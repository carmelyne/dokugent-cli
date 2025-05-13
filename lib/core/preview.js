/**
 * Generates a preview of Dokugent agent scaffolds for human inspection before compilation.
 * Dumps validated plan, conventions, and criteria into .dokugent/preview/ as formatted files.
 * Designed as a preflight step to help users confirm structure and content.
 */

import fs from 'fs-extra'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'
import { getAgentProfiles } from '../config/agentsConfig.js';
import yaml from 'js-yaml';
import { estimateTokensFromText } from '../utils/tokenUtils.js';
import { runSecurityCheck } from './security.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dokugentPath = path.join(process.cwd(), '.dokugent')
const previewPath = path.join(dokugentPath, 'preview')

export async function generatePreview(agentKey, variantKey) {
  console.log('\n🔐 Running security check before generating preview...');
  await runSecurityCheck();
  console.log('\n✅ Security check passed. Proceeding with preview render.');

  if (fs.existsSync(previewPath)) {
    fs.emptyDirSync(previewPath);
    console.log('\n🧹 Cleared existing preview folder.');
  }
  await fs.ensureDir(previewPath)

  const agents = await getAgentProfiles();
  let activeAgent;
  if (agentKey && !agents[agentKey]) {
    console.log(`\n⚠️  Unknown agent: ${agentKey}. Falling back to default (Codex CLI).`);
    console.log(`ℹ️  Tip: Run 'dokugent help preview' to see supported agents.\n`);
    agentKey = 'codex';
  }

  const selected = agents[agentKey];
  if (selected?.variants) {
    if (!variantKey || !selected.variants[variantKey]) {
      const variantList = Object.keys(selected.variants).join(' | ');
      console.error(`\n⚠️ Missing or unknown variant. Use --variant ${variantList}`);
      return;
    }
    activeAgent = selected.variants[variantKey];
  } else {
    activeAgent = selected || agents.codex || {};
  }
  const idealMaxTokens = activeAgent.idealBriefingSize || 4000;
  const timestamp = new Date().toISOString()
  const metadata = { previewed_by: 'dokugent', timestamp }
  let totalTokens = 0

  async function mergeMdFiles(srcFolder, outName) {
    if (!(await fs.pathExists(srcFolder))) {
      console.warn(`⚠️  Skipped: ${srcFolder} not found`)
      return
    }

    let merged = ''

    async function walkAndMerge(folder) {
      const entries = await fs.readdir(folder, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(folder, entry.name)
        if (entry.isDirectory()) {
          await walkAndMerge(fullPath)
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf8')
          merged += `\n\n# ${entry.name}\n\n${content}`
        }
      }
    }

    await walkAndMerge(srcFolder)

    if (!merged.trim()) {
      console.warn(`⚠️  Skipped: No .md files found recursively in ${srcFolder}`)
      return
    }

    const output = matter.stringify(merged.trim(), metadata)
    await fs.writeFile(path.join(previewPath, outName), output)
    const estimatedTokens = estimateTokensFromText(merged);
    totalTokens += estimatedTokens
    console.log(`✅ Wrote: ${outName} (${estimatedTokens} tokens est.)`)
  }

  async function copyYamlFile(srcFile, outName) {
    if (!(await fs.pathExists(srcFile))) {
      console.warn(`⚠️  Skipped: ${srcFile} not found`)
      return
    }
    const content = await fs.readFile(srcFile, 'utf8')
    await fs.writeFile(path.join(previewPath, outName), content)
    const estimatedTokens = estimateTokensFromText(content);
    totalTokens += estimatedTokens
    console.log(`✅ Wrote: ${outName} (${estimatedTokens} tokens est.)`)
  }

  async function copyAgentMdFiles(srcFolder) {
    if (!(await fs.pathExists(srcFolder))) {
      console.warn(`⚠️  Skipped: ${srcFolder} not found`)
      return
    }
    const files = await fs.readdir(srcFolder)
    for (const file of files) {
      const ext = path.extname(file)
      const base = path.basename(file, ext)
      const source = path.join(srcFolder, file)
      const target = path.join(previewPath, `preview-${base}${ext}`)
      if (ext === '.md') {
        const content = await fs.readFile(source, 'utf8')
        const output = matter.stringify(content, metadata)
        await fs.writeFile(target, output)
        const estimatedTokens = estimateTokensFromText(content);
        totalTokens += estimatedTokens
        console.log(`✅ Wrote: preview-${base}.md (${estimatedTokens} tokens est.)`)
      } else if (ext === '.yaml') {
        await fs.copyFile(source, target)
        console.log(`✅ Wrote: preview-${base}${ext}`)
      }
    }
  }

  async function previewAgentSpecYaml() {
    const specYamlPath = path.join(dokugentPath, 'agent', 'agentSpec.yaml')
    const specJsPath = path.join(dokugentPath, 'agent', 'agentSpec.mjs')
    const outPath = path.join(previewPath, 'preview-agent-spec.md')

    let content = ''
    if (await fs.pathExists(specYamlPath)) {
      content = await fs.readFile(specYamlPath, 'utf8')
    } else if (await fs.pathExists(specJsPath)) {
      try {
        const jsSpecModule = await import(specJsPath)
        const spec = jsSpecModule?.agentSpec || jsSpecModule.default
        if (!spec) {
          console.warn(`⚠️  Found ${specJsPath} but no export named agentSpec or default.`)
          return
        }
        content = yaml.dump(spec)
      } catch (err) {
        console.warn(`⚠️  Failed to import agentSpec.js: ${err.message}`)
        return
      }
    } else {
      console.warn(`⚠️  Skipped: ${specYamlPath} not found and no agentSpec.js fallback.`)
      return
    }

    const output = matter.stringify(content.trim(), metadata)
    await fs.writeFile(outPath, output)
    const estimatedTokens = estimateTokensFromText(content);
    totalTokens += estimatedTokens
    console.log(`✅ Wrote: preview-agent-spec.md (${estimatedTokens} tokens est.)`)
  }

  await mergeMdFiles(path.join(dokugentPath, 'plan'), 'preview-plan.md');
  await mergeMdFiles(path.join(dokugentPath, 'criteria'), 'preview-criteria.md');
  await copyYamlFile(path.join(dokugentPath, 'criteria', 'criteria.yaml'), 'preview-criteria.yaml');

  try {
    const realConventionsPath = await fs.realpath(path.join(dokugentPath, 'conventions', 'dev'));
    await mergeMdFiles(realConventionsPath, 'preview-conventions.md');
  } catch {
    console.warn(`⚠️  Symlink missing or invalid: conventions/dev`);
  }

  await copyAgentMdFiles(path.join(dokugentPath, 'agent-tools'))
  await previewAgentSpecYaml()

  console.log(`\n🧠 Estimated Total Tokens: ${totalTokens}`);
  console.log(`🎯 Agent: ${activeAgent.label || 'Codex'} (Max Token Load: ${activeAgent.maxTokenLoad || 'N/A'} tokens)`);

  if (totalTokens > idealMaxTokens) {
    console.warn(`⚠️ Over the ideal optimal size of ${idealMaxTokens} tokens — consider trimming files.`);
  } else {
    console.log(`✅ Within the ideal optimal size of ${idealMaxTokens} tokens.`);
  }

  if (activeAgent.notes) {
    console.log(`🤖 ${activeAgent.notes.trim()}`);
  }
}
