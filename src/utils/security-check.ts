import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import glob from 'fast-glob';

type ScanOptions = {
  denyList?: string[];
  requireApprovals?: boolean;
  scanPath?: string;
};

export async function runSecurityCheck({
  denyList = [],
  requireApprovals = false,
  scanPath
}: ScanOptions = {}) {
  const root = scanPath ? path.resolve(process.cwd(), scanPath) : path.resolve(process.cwd(), '.dokugent');
  console.log('🔍 Running security scan in:', root);

  const filePatterns = scanPath === '.dokugent/preview'
    ? ['*.md', '*.yaml']
    : [
      'plan/**/*.yaml',
      'criteria/**/*.yaml',
      'agent-tools/**/*.yaml',
      'plan/**/*.md',
      'criteria/**/*.md',
      'agent-tools/**/*.md'
    ];

  const files = await glob(filePatterns, {
    cwd: root,
    absolute: true,
    ignore: ['**/*-20??-??-??T*.*']
  });

  console.log(`\n🗂️  Files scanned: ${files.length}\n`);

  const sensitivePatterns = [
    /api[_-]?key\s*:/i,
    /secret\s*:/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /gh[pousr]_[a-zA-Z0-9]{30,}/,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/ // JWTs
  ];

  let issues = 0;

  for (const file of files) {
    const relPath = path.relative(root, file);
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