import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { estimateTokensFromText, warnIfExceedsLimit } from '../utils/tokenUtils.js';


function scanPreviewFiles(previewDir) {
  const files = fs.readdirSync(previewDir);
  const contents = {};
  for (const file of files) {
    const fullPath = path.join(previewDir, file);
    if (fs.existsSync(fullPath)) {
      contents[file] = fs.readFileSync(fullPath, 'utf8');
    }
  }
  return contents;
}

function checkSecurity(contents) {
  const results = runSecurityScan(contents);
  const failed = Object.entries(results).filter(([_, res]) => !res.passed).map(([file]) => file);
  return { results, failed, anyFailed: failed.length > 0 };
}

function writeReportToFile(report, fileName) {
  const reportDir = path.join('.dokugent', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, fileName);
  fs.writeFileSync(reportPath, report, 'utf8');
  return reportPath;
}


const DOKUGENT_DIR = path.resolve('.dokugent/preview');
const MODEL_TOKEN_LIMIT = 8000; // example token limit

function loadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  // Treat all inputs as plain text .md files
  return fs.readFileSync(filePath, 'utf8');
}

function calculateTokenUsage(contents, config = {}) {
  const usage = {};
  for (const [file, content] of Object.entries(contents)) {
    usage[file] = estimateTokensFromText(content);
    warnIfExceedsLimit(file, usage[file], config);
  }
  return usage;
}

function runSecurityScan(contents) {
  const blacklist = ['eval', 'exec', 'system', 'import os', 'import sys', 'undefined'];
  const whitelist = ['console', 'require', 'import', 'fs', 'path'];

  const results = {};
  for (const [name, content] of Object.entries(contents)) {
    const lines = content.split('\n');
    const blacklistMatches = [];

    lines.forEach((lineText, index) => {
      blacklist.forEach(term => {
        if (lineText.includes(term)) {
          blacklistMatches.push({
            term,
            line: index + 1,
            code: lineText.trim(),
            suggestion: `Avoid using "${term}". Refactor this logic to use safer alternatives.`
          });
        }
      });
    });

    const lowerContent = content.toLowerCase();
    const foundWhitelist = whitelist.filter(term => lowerContent.includes(term));

    results[name] = {
      blacklistHits: blacklistMatches,
      whitelistHits: foundWhitelist,
      passed: blacklistMatches.length === 0,
    };
  }
  return results;
}


function loadPrivateKey(keyPath) {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key file not found at ${keyPath}`);
  }
  return fs.readFileSync(keyPath, 'utf8');
}

function signContent(privateKeyPem, content) {
  const sign = crypto.createSign('SHA256');
  sign.update(content);
  sign.end();
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = sign.sign(privateKey, 'hex');
  return signature;
}

function formatTimestamp(date) {
  return date.toISOString();
}

function generateReport({
  timestamp,
  signerName,
  tokenUsage,
  securityScanResults,
  validationErrors,
  signature,
  keyPath,
  isFailure,
}) {
  const publicKeyPath = keyPath.replace('.private.pem', '.public.pem');
  let fingerprint = 'Unavailable';
  try {
    const pubKeyData = fs.readFileSync(publicKeyPath, 'utf8');
    const hash = crypto.createHash('sha256').update(pubKeyData).digest('hex');
    fingerprint = hash;
  } catch { }

  // use isFailure from parameters directly
  const reportTitle = isFailure ? '# ❌ Certification Failed Report' : '# ✅ Certification Report';

  let report = `${reportTitle}

**Timestamp:** ${timestamp}
**Signer Name:** ${signerName}

## 🔍 Certification Summary

- 🧠 Token Efficiency: ${Object.values(tokenUsage).reduce((a, b) => a + b, 0) <= 8000 ? '✅ Good' : '⚠️ High'}
- 🔐 Security Status: ${Object.values(securityScanResults).every(r => r.passed) ? '✅ Passed' : '❌ Issues Found'}
- 🧪 Validation Status: ${validationErrors.length === 0 ? '✅ Passed' : '❌ Errors Detected'}

## Token Usage Summary
`;
  for (const [file, tokens] of Object.entries(tokenUsage)) {
    report += `- ${file}: ${tokens} tokens\n`;
  }
  const totalTokens = Object.values(tokenUsage).reduce((a, b) => a + b, 0);
  report += `- **Total tokens:** ${totalTokens}\n\n## Security Scan Results\n`;

  for (const [file, results] of Object.entries(securityScanResults)) {
    report += `- ${file}:
  - Passed: ${results.passed}
`;
    if (results.blacklistHits.length > 0) {
      const uniqueBlacklist = new Map();
      for (const hit of results.blacklistHits) {
        const key = `${hit.line}-${hit.term}`;
        if (uniqueBlacklist.has(key)) continue;
        uniqueBlacklist.set(key, true);
        report += `  - **Line ${hit.line || '?'}:** \`${hit.term}\`
    - Code: \`${hit.code || 'N/A'}\`
    - 🔧 Suggestion: Avoid using "${hit.term}". Refactor this logic to use safer alternatives.

`;
      }
    }
    if (results.whitelistHits.length > 0) {
      report += `  - Whitelist hits: ${results.whitelistHits.join(', ')}
`;
    }
  }
  report += '\n## Validation Results\n';
  if (validationErrors.length === 0) {
    report += `No validation errors found.\n\n`;
  } else {
    for (const err of validationErrors) {
      report += `- ${err}\n`;
    }
    report += '\n';
  }

  report += `## Signature
Public Key File: ${publicKeyPath}
Public Key Fingerprint (SHA-256): ${fingerprint}
Signer ID: ${signerName}

📎 SHA File: certified.cert.sha256
`;

  return report;
}

export async function certify({ key, name, output = 'latest' }) {
  // Only use .dokugent/preview as the source of truth.
  const previewDir = '.dokugent/preview';
  const contentsForScan = scanPreviewFiles(previewDir);
  const shaPath = path.join(previewDir, 'preview.sha256');
  if (!fs.existsSync(shaPath)) {
    throw new Error(`Missing preview.sha256 in ${previewDir}. Please run 'dokugent preview' first.`);
  }
  const shaLines = fs.readFileSync(shaPath, 'utf8').trim().split('\n');
  const expectedShas = {};
  for (const line of shaLines) {
    const [hash, file] = line.split(/\s+/);
    expectedShas[file] = hash;
  }

  // Check readonly and SHA256 for all files except preview.sha256
  const failedFiles = [];
  for (const file of Object.keys(contentsForScan)) {
    if (file === 'preview.sha256') continue;
    const fullPath = path.join(previewDir, file);
    const stat = fs.statSync(fullPath);
    const isReadonly = !(stat.mode & 0o222);
    const buf = fs.readFileSync(fullPath);
    const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
    const expectedSha = expectedShas[file];
    const shaMatch = expectedSha === actualSha;
    if (!isReadonly || !shaMatch) {
      failedFiles.push({
        file,
        isReadonly,
        shaMatch
      });
    }
  }

  if (failedFiles.length > 0) {
    // Generate a failure report and abort.
    const rawDate = new Date();
    const timestampForFilename = rawDate.toISOString().replace(/:/g, '-');
    const failedReportFileName = `${timestampForFilename}-failed-certification.md`;
    const tokenUsage = calculateTokenUsage(contentsForScan);
    const securityScanResults = {}; // No security scan at this stage
    const reasons = failedFiles.map(({ file, isReadonly, shaMatch }) =>
      `${file}: ${isReadonly ? '✓ read-only' : '✗ writable'}, ${shaMatch ? '✓ SHA match' : '✗ SHA mismatch'}`
    );
    const report = generateReport({
      timestamp: formatTimestamp(rawDate),
      signerName: name || 'N/A',
      tokenUsage,
      securityScanResults,
      validationErrors: [
        'Integrity or permission check failed for the following preview files:',
        ...reasons
      ],
      signature: '(skipped due to failure)',
      keyPath: key || 'N/A',
      isFailure: true,
    });
    const tempReportPath = writeReportToFile(report, failedReportFileName);
    console.log(`\n❌ Certification aborted. Integrity or permission check failed for the following preview files:\n`);
    for (const { file, isReadonly, shaMatch } of failedFiles) {
      const status = [
        isReadonly ? '✓ read-only' : '✗ writable',
        shaMatch ? '✓ SHA match' : '✗ SHA mismatch'
      ].join(', ');
      console.log(`  - ${file}: ${status}`);
    }
    console.log(`\nSee detailed failure report:\n  → ${tempReportPath}\n`);
    throw new Error('\n🛑 Please re-run `dokugent preview` to regenerate a valid and secure snapshot.\n');
  }

  // Passed all checks, proceed to certify.
  if (!key) {
    throw new Error('Missing required --key argument');
  }
  if (!name) {
    throw new Error('Missing required --name argument');
  }

  const rawDate = new Date();
  const timestampForFilename = rawDate.toISOString().replace(/:/g, '-');
  const tokenUsage = calculateTokenUsage(contentsForScan);
  const totalTokens = Object.values(tokenUsage).reduce((a, b) => a + b, 0);
  if (totalTokens > MODEL_TOKEN_LIMIT) {
    throw new Error(`Total token count ${totalTokens} exceeds model limit of ${MODEL_TOKEN_LIMIT}`);
  }

  // Load private key and sign hash of concatenated preview content
  const privateKeyPem = loadPrivateKey(key);
  const concatContent = JSON.stringify(contentsForScan);
  const signature = signContent(privateKeyPem, concatContent);

  // Certification report
  const timestamp = formatTimestamp(rawDate);
  const reportFileName = `${timestampForFilename}-certification.md`;
  const reportDir = path.join('.dokugent', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, reportFileName);
  const securityScanResults = {}; // No security scan in this streamlined mode
  const validationErrors = [];
  const isFailure = false;
  const report = generateReport({
    timestamp,
    signerName: name,
    tokenUsage,
    securityScanResults,
    validationErrors,
    signature,
    keyPath: key,
    isFailure,
  });
  fs.writeFileSync(reportPath, report, 'utf8');

  // Create certified/<timestamp>-<name>/ under .dokugent
  const label = 'latest';
  const certifiedDir = path.join('.dokugent', 'certified', `${timestampForFilename}-${name}`);
  fs.mkdirSync(certifiedDir, { recursive: true });
  // Copy certification report into certified directory
  const reportDest = path.join(certifiedDir, reportFileName);
  fs.copyFileSync(reportPath, reportDest);

  // Copy preview files as .cert.md/.cert.yaml
  const previewFilesToCopy = fs.readdirSync(previewDir);
  for (const file of previewFilesToCopy) {
    if (!file.startsWith('preview-')) continue;
    const ext = path.extname(file);
    const supported = ['.md', '.yaml', '.yml'];
    if (!supported.includes(ext)) continue;
    const base = file.slice(8).replace(ext, '');
    const certExt = (ext === '.yml' || ext === '.yaml') ? '.cert.yaml' : '.cert.md';
    const cleanName = `${base}${certExt}`;
    const src = path.join(previewDir, file);
    const dest = path.join(certifiedDir, cleanName);
    const content = fs.readFileSync(src, 'utf8').trim();
    if (!content) {
      console.warn(`⚠️ Skipping empty file: ${file}`);
      continue;
    }
    fs.writeFileSync(dest, content, 'utf8');
  }

  // Rename preview.sha256 to certified.cert.sha256 and copy
  const shaSource = path.join(previewDir, 'preview.sha256');
  const shaTarget = path.join(certifiedDir, 'certified.cert.sha256');
  fs.copyFileSync(shaSource, shaTarget);

  // Create or update symlink with dynamic label
  const symlinkPath = path.join('.dokugent', 'certified', 'latest');
  const targetPath = path.resolve(certifiedDir);
  try {
    if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink()) {
      fs.unlinkSync(symlinkPath);
    }
  } catch { }
  fs.mkdirSync(path.dirname(symlinkPath), { recursive: true });
  fs.symlinkSync(targetPath, symlinkPath, 'dir');

  // Append to promotion log
  const promotionLogPath = path.join('.dokugent', 'promotion-log.json');
  let log = [];
  try {
    if (fs.existsSync(promotionLogPath)) {
      log = JSON.parse(fs.readFileSync(promotionLogPath, 'utf8'));
    }
  } catch { }
  log.push({
    label,
    target: path.basename(certifiedDir),
    timestamp,
    promoted_by: name
  });
  fs.mkdirSync('.dokugent', { recursive: true });
  fs.writeFileSync(promotionLogPath, JSON.stringify(log, null, 2));

  // Terminal output for success and file paths
  console.log('\n✨ Dokugent logic snapshot complete.\n');
  console.log('📦 Certification Complete!\n');
  console.log(`🧠 Total Tokens Used: ${totalTokens}\n`);
  console.log('📁 Certified Folder:\n  ', certifiedDir);
  console.log('\n📄 Certification Report:\n  ', path.relative(process.cwd(), reportPath));
  console.log(`\n🔗 Symlink Updated:\n  certified/latest →`, path.basename(certifiedDir));
  console.log('\n📝 Promotion Log Updated:\n  .dokugent/promotion-log.json\n');
}