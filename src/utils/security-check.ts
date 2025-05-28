/**
 * @file security-check.ts
 * @description Runs a basic static scan of agent-related files to detect secrets,
 * denied patterns, and missing approvals. Used for preview and certification safety.
 */
import { loadBlacklist, loadWhitelist } from '@security/loaders';
import { formatRelativePath } from '@utils/format-path';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import glob from 'fast-glob';

type ScanOptions = {
  denyList?: string[];
  requireApprovals?: boolean;
  scanPath?: string;
};

/**
 * Scans agent files for sensitive patterns, denied terms, or missing approval metadata.
 *
 * Responsibilities:
 * - Resolves scan root path from `scanPath` or defaults to `.dokugent/`
 * - Applies regex checks for secrets (API keys, JWTs, etc.)
 * - Flags terms from optional denylist
 * - Warns on missing `approved_by` and `approved_at` if `requireApprovals` is true
 *
 * @param options Object containing denyList, requireApprovals, and scanPath
 * @returns {Promise<void>}
 */
export async function runSecurityCheck({
  denyList = [],
  requireApprovals = false,
  scanPath
}: ScanOptions = {}) {
  const root = scanPath ? path.resolve(process.cwd(), scanPath) : path.resolve(process.cwd(), '.dokugent/data');
  console.log('🔍 Running security scan in:', formatRelativePath(root));

  const filePatterns = (scanPath?.includes('preview') || scanPath?.includes('previews'))
    ? ['**/*.md', '**/*.yaml', '**/*.json']
    : [
      'plans/**/*.json',
      'plans/**/*.md',
      'plans/**/*.yaml',
      'criteria/**/*.json',
      'criteria/**/*.md',
      'criteria/**/*.yaml',
      'agent-tools/**/*.json',
      'agent-tools/**/*.md',
      'agent-tools/**/*.yaml',
      'conventions/**/*.json',
      'conventions/**/*.md',
      'conventions/**/*.yaml',
      'previews/**/*.json',
      'previews/**/*.md',
      'previews/**/*.yaml'
    ];

  const files = await glob(filePatterns, {
    cwd: formatRelativePath(root),
    absolute: true,
    ignore: ['**/*-20??-??-??T*.*']
  });

  const displayedFiles = files.map(formatRelativePath);
  if (displayedFiles.length) {
    console.log(`\n📄 Found ${displayedFiles.length} file${displayedFiles.length > 1 ? 's' : ''} to scan:`);
    for (const file of displayedFiles) {
      console.log(`   • ${file}`);
    }
  } else {
    console.log('\n📄 No files matched the scan criteria.');
  }
  console.log(`\n🔢 Total files scanned: ${files.length}\n`);

  const sensitivePatterns = [
    /api[_-]?key\s*:/i,
    /secret\s*:/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /gh[pousr]_[a-zA-Z0-9]{30,}/,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/ // JWTs
  ];

  let issues = 0;

  for (const file of files) {
    const relPath = formatRelativePath(file);
    const content = await fs.readFile(file, 'utf8');
    let parsed: any = {};

    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      try {
        parsed = yaml.load(content);
      } catch {
        console.warn(`⚠️  Skipping unreadable YAML: ${file}`);
      }
    }

    const lines = content.split('\n');

    for (const [i, line] of lines.entries()) {
      for (const term of denyList) {
        if (line.includes(term)) {
          console.warn(`🚫 Denied pattern "${term}" in ${relPath} (line ${i + 1})`);
          issues++;
        }
      }

      for (const regex of sensitivePatterns) {
        if (regex.test(line)) {
          console.warn(`🔐 Possible secret in ${relPath} (line ${i + 1})`);
          issues++;
        }
      }
    }

    if (requireApprovals && (!parsed?.approved_by || !parsed?.approved_at)) {
      console.warn(`⚠️  Missing approval metadata in ${relPath}`);
      issues++;
    }
  }

  if (issues === 0) {
    console.log('✅ No security issues detected.\n');
  } else {
    console.log(`\n🔎 Review complete: ${issues} potential issue(s) found.\n`);
  }

}

export { loadBlacklist, loadWhitelist };
