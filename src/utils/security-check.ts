import fs from 'fs';
import path from 'path';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, phaseHeader } from '@utils/cli/ui';

/**
 * Scans files in the given directories for basic compliance issues.
 *
 * Currently performs:
 * - Presence check for 'agentId' string in file contents (placeholder check).
 *
 * Future planned checks include:
 * - Regex scans for secrets (e.g., API keys, tokens)
 * - Denylist keyword detection
 * - Approval metadata presence
 */
interface ScanOptions {
  denyList?: string[];
  requireApprovals?: boolean;
  scanPaths?: string[];
  certifiedJson?: Record<string, any>; // ✅ Allow for compile-mode checks
}

export async function runSecurityCheck(context: 'security' | 'preview' | 'compile', options: ScanOptions): Promise<string[]> {
  // Recursively collect all files under a directory
  function getAllFiles(dirPath: string): string[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
  const { denyList = [], requireApprovals = false, scanPaths = [] } = options;
  let pathsToScan: string[] = [];
  const scannedFiles: string[] = [];

  switch (context) {
    case 'security':
      pathsToScan = ['.dokugent/'];
      break;
    case 'preview':
      pathsToScan = [
        '.dokugent/data/plans',
        '.dokugent/data/criteria',
        '.dokugent/data/conventions'
      ];
      break;
    case 'compile':
      pathsToScan = [
        '.dokugent/data/byo',
        '.dokugent/ops/certified'
      ];
      break;
    default:
      throw new Error(`Unknown context for runSecurityCheck: ${context}`);
  }

  const issues: string[] = [];

  for (const scanPath of pathsToScan) {
    try {
      if (!fs.existsSync(scanPath)) continue;
      const stat = fs.statSync(scanPath);
      const filePaths = stat.isDirectory() ? getAllFiles(scanPath) : [scanPath];
      for (const filePath of filePaths) {
        if (!fs.statSync(filePath).isFile()) continue;
        const entry = path.basename(filePath);
        scannedFiles.push(filePath);

        // Skip junk/system files
        if (['.DS_Store', '.dokugentignore'].includes(entry)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        denyList.forEach((term) => {
          if (content.includes(term)) {
            issues.push(`${entry} contains blacklisted term: ${term}`);
          }
        });

        // Placeholder for future checks
        if (requireApprovals && !content.includes('approved: true')) {
          issues.push(`${entry} is missing approval metadata`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan path ${scanPath}: ${(error as Error).message}`);
    }
  }

  // Check if can be removed
  // if (scannedFiles.length > 0) {
  //   console.log('\n🔍 Files scanned:');
  //   scannedFiles.forEach(file => console.log(`   - ${file}`));
  // }
  console.log()
  paddedCompact('dokugent security initialized...', '', PAD_WIDTH, 'info');

  if (issues.length > 0) {
    paddedDefault('', 'Security Issues Found', PAD_WIDTH, 'warn', 'WARN');
    console.log()
    issues.forEach((issue) => console.log(padMsg(`  - ${issue}`)));
  } else {
    // Replace
    // console.log('\n✅ No security issues found.\n');
  }

  return issues;
}
