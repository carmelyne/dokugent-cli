import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { estimateTokensFromText, warnIfExceedsLimit } from '../utils/tokenUtils.js';

import { loadSpecStructure } from '../utils/loadSpecStructure.js';

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
  const reportDir = path.resolve('reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, fileName);
  fs.writeFileSync(reportPath, report, 'utf8');
  return reportPath;
}

function parseProjectFiles({ agentSpecRaw, planRaw, criteriaRaw }) {
  const validationErrors = [];
  let agentSpec = null;
  let plan = null;
  let criteria = null;

  try {
    agentSpec = yaml.load(agentSpecRaw);
  } catch {
    validationErrors.push('agentSpec could not be parsed as valid YAML.');
  }
  try {
    plan = yaml.load(planRaw);
  } catch {
    validationErrors.push('plan.yaml could not be parsed as valid YAML.');
  }
  try {
    criteria = yaml.load(criteriaRaw);
  } catch {
    validationErrors.push('criteria.yaml could not be parsed as valid YAML.');
  }

  return { agentSpec, plan, criteria, validationErrors };
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

function validateStructure(agentSpec, plan, criteria) {
  const errors = [];

  if (!agentSpec) errors.push('agentSpec file is missing or could not be loaded.');

  // Check expected structure in agentSpec
  if (agentSpec) {
    if (!agentSpec.roles || !Array.isArray(agentSpec.roles))
      errors.push('agentSpec.roles is missing or not an array.');
    if (!agentSpec.tools || !Array.isArray(agentSpec.tools))
      errors.push('agentSpec.tools is missing or not an array.');
    if (!agentSpec.protocols || !Array.isArray(agentSpec.protocols))
      errors.push('agentSpec.protocols is missing or not an array.');
  }

  return errors;
}

function validatePlanCriteria(plan, criteria, agentSpec) {
  const errors = [];

  if (!plan || !criteria || !agentSpec) return errors;

  // Validate roles
  if (plan.roles) {
    for (const role of plan.roles) {
      if (!agentSpec.roles.includes(role)) {
        errors.push(`Role '${role}' in plan.yaml not found in agentSpec.roles`);
      }
    }
  }
  if (criteria.roles) {
    for (const role of criteria.roles) {
      if (!agentSpec.roles.includes(role)) {
        errors.push(`Role '${role}' in criteria.yaml not found in agentSpec.roles`);
      }
    }
  }

  // Validate tools
  if (plan.tools) {
    for (const tool of plan.tools) {
      if (!agentSpec.tools.includes(tool)) {
        errors.push(`Tool '${tool}' in plan.yaml not found in agentSpec.tools`);
      }
    }
  }
  if (criteria.tools) {
    for (const tool of criteria.tools) {
      if (!agentSpec.tools.includes(tool)) {
        errors.push(`Tool '${tool}' in criteria.yaml not found in agentSpec.tools`);
      }
    }
  }

  // Validate protocols
  if (plan.protocols) {
    for (const protocol of plan.protocols) {
      if (!agentSpec.protocols.includes(protocol)) {
        errors.push(`Protocol '${protocol}' in plan.yaml not found in agentSpec.protocols`);
      }
    }
  }
  if (criteria.protocols) {
    for (const protocol of criteria.protocols) {
      if (!agentSpec.protocols.includes(protocol)) {
        errors.push(`Protocol '${protocol}' in criteria.yaml not found in agentSpec.protocols`);
      }
    }
  }

  return errors;
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
`;

  return report;
}

export async function certify({ key, name, output = 'beta' }) {
  // Step 1: Load files using structure.yaml loader
  const {
    agentSpec: agentSpecRaw,
    plan: planRaw,
    criteria: criteriaRaw,
    config,
    hooks,
    list,
    conventionsPath,
    previewPath,
    certifiedPath,
    reportsPath,
  } = loadSpecStructure();

  // Step 2: Scan preview files, run security scan, and handle early failure
  const contentsForScan = scanPreviewFiles(DOKUGENT_DIR);
  const { results: securityScanResults, failed: failedFiles, anyFailed: securityFailed } = checkSecurity(contentsForScan);
  const tokenUsage = calculateTokenUsage(contentsForScan, config); // Calculate once after scanning

  const rawDate = new Date();
  const timestampForFilename = rawDate.toISOString().replace(/:/g, '-');

  if (securityFailed) {
    const failedReportFileName = `${timestampForFilename}-failed-certification.md`;
    // tokenUsage is already calculated
    const report = generateReport({
      timestamp: formatTimestamp(rawDate),
      signerName: name,
      tokenUsage,
      securityScanResults,
      validationErrors: ['Security scan failed in one or more files.'],
      signature: '(signature skipped due to failure)',
      keyPath: key,
      isFailure: true,
    });

    const tempReportPath = writeReportToFile(report, failedReportFileName);

    console.log(`\n🔐 Security scan failed in ${failedFiles.length} file(s):`);
    for (const file of failedFiles) {
      console.log(`  • ${file}`);
    }

    throw new Error(`\n❌ Security scan failed — certification aborted.\n\nReview the failure report:\n\n  → ${tempReportPath}\n\n`);
  }

  // tokenUsage is already calculated
  const totalTokens = Object.values(tokenUsage).reduce((a, b) => a + b, 0);
  if (totalTokens > MODEL_TOKEN_LIMIT) {
    throw new Error(`Total token count ${totalTokens} exceeds model limit of ${MODEL_TOKEN_LIMIT}`);
  }

  // Step 4: Ensure required files present and structure valid
  // Parse agentSpec, plan, criteria using parseProjectFiles
  const parsed = parseProjectFiles({ agentSpecRaw, planRaw, criteriaRaw });
  const { agentSpec, plan, criteria, validationErrors } = parsed;

  // If core spec files failed to parse or are missing, generate a failure report and abort.
  // This check is done after the security scan, assuming security passed.
  if (!agentSpec || !plan || !criteria) {
    const failedReportFileName = `${timestampForFilename}-failed-certification.md`;
    // Use existing validationErrors from parsing, and add a general message if needed.
    const allParsingErrors = [...validationErrors];
    if (allParsingErrors.length === 0) { // Add a generic message if yaml.load returned null without specific errors
      allParsingErrors.push('One or more core specification files (agentSpec, plan, or criteria) are missing or could not be parsed.');
    }

    const report = generateReport({
      timestamp: formatTimestamp(rawDate),
      signerName: name || 'N/A (Signer name not applicable for this failure)',
      tokenUsage, // Already calculated
      securityScanResults, // Security scan presumably passed if we reached here
      validationErrors: allParsingErrors,
      signature: '(signature skipped due to parsing failure)',
      keyPath: key || 'N/A (Key path not applicable for this failure)',
      isFailure: true,
    });

    const tempReportPath = writeReportToFile(report, failedReportFileName);
    let errorMessages = "\n❌ Core specification file parsing failed — certification aborted.";
    errorMessages += "\n\nParsing issues:\n" + allParsingErrors.map(e => `  • ${e}`).join('\n');
    errorMessages += `\n\nReview the failure report:\n\n  → ${tempReportPath}\n\n`;
    throw new Error(errorMessages);
  }

  // This block now executes only if agentSpec, plan, and criteria were all successfully parsed.
  validationErrors.push(...validateStructure(agentSpec));
  validationErrors.push(...validatePlanCriteria(plan, criteria, agentSpec));

  // const isFailure = securityFailed || (validationErrors && validationErrors.length > 0);
  const isFailure = securityFailed;

  // Step 6: Check key and name provided
  if (!key) {
    throw new Error('Missing required --key argument');
  }
  if (!name) {
    throw new Error('Missing required --name argument');
  }

  // Step 7: Load private key and sign hash of concatenated content
  const privateKeyPem = loadPrivateKey(key);
  const concatContent = JSON.stringify(contentsForScan);
  const signature = signContent(privateKeyPem, concatContent);

  // Step 8: Output certify-report.md
  const timestamp = formatTimestamp(rawDate);
  const reportFileName = `${timestampForFilename}-certification.md`;
  const reportDir = path.resolve('reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, reportFileName);
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

  const label = output;
  const certifiedDir = path.join('certified', `${timestampForFilename}-${name}`);
  fs.mkdirSync(certifiedDir, { recursive: true });

  const previewDir = '.dokugent/preview';
  const previewFilesToCopy = fs.readdirSync(previewDir);

  // Copy certification report into certified directory
  const reportDest = path.join(certifiedDir, reportFileName);
  fs.copyFileSync(reportPath, reportDest);

  // Only process files prefixed with preview-
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

  // Create or update symlink with dynamic label
  const symlinkPath = path.join('certified', label);
  try {
    if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink()) {
      fs.unlinkSync(symlinkPath);
    }
  } catch { }
  fs.symlinkSync(certifiedDir, symlinkPath);

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
  console.log(`\n🔗 Symlink Updated:\n  certified/${label} →`, path.basename(certifiedDir));
  console.log('\n📝 Promotion Log Updated:\n  .dokugent/promotion-log.json\n');
}