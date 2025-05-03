import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import { folderGroups } from '../config/scaffold-groups.js';

const dokugentPath = path.join(process.cwd(), '.dokugent');
const versionsPath = path.join(dokugentPath, 'versions.json');
let versionTag = '';
if (process.argv.includes('--versioned')) {
  const versions = fs.readJsonSync(versionsPath);
  const next = versions.latest + 1;
  versionTag = `.v${next}`;
}

// Compile agent briefing, with optional certificate verification, dev mode, or LLM mode
export async function compileBriefing(agent) {
  const certPath = path.join(dokugentPath, 'certs', 'review.cert');
  const pubKeyPath = path.join(dokugentPath, 'keys', 'id_doku_pub.pem');
  const compiledDir = path.join(dokugentPath, 'compiled-agent-specs');

  // Determine modes
  const certRequired = process.argv.includes('--prod');
  const devMode = process.argv.includes('--dev');
  const llmArg = process.argv.find(arg => arg.startsWith('--llm='));
  const llmAgent = llmArg ? llmArg.split('=')[1] : null;

  const modeDir = devMode ? 'dev' : certRequired ? 'prod' : '';
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15); // e.g., 20240503T153012
  const versionSuffix = versionTag;
  const baseDir = modeDir ? path.join(compiledDir, modeDir) : compiledDir;
  fs.ensureDirSync(baseDir);

  if (certRequired) {
    // Certification mode: verify review.md with cert and signature
    const reviewPlanPath = path.join(dokugentPath, 'review', 'review-plan.yaml');
    const reviewProtocolsPath = path.join(dokugentPath, 'review', 'review-protocols.md');
    const targetReviewPath = agent === 'plan' ? reviewPlanPath : reviewProtocolsPath;

    if (!fs.existsSync(targetReviewPath) || !fs.existsSync(certPath) || !fs.existsSync(pubKeyPath)) {
      console.error('❌ Missing required review file, cert, or public key for verification');
      process.exit(1);
    }

    const reviewContent = fs.readFileSync(targetReviewPath, 'utf-8');
    const currentHash = crypto.createHash('sha256').update(reviewContent).digest('hex');

    const cert = JSON.parse(fs.readFileSync(certPath, 'utf-8'));
    const expectedHash = agent === 'plan' ? cert.review_plan_hash : cert.review_protocols_hash;
    console.log('🧾 Expected hash:', expectedHash);
    console.log('📄 Current hash: ', currentHash);

    if (expectedHash !== currentHash) {
      console.error('❌ review.md has changed since certification – hash mismatch');
      process.exit(1);
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    // Use the same signing input as certify.js: concatenated hashes
    const combinedHash = cert.review_plan_hash + cert.review_protocols_hash;
    verifier.update(combinedHash);
    verifier.end();

    const pubKey = fs.readFileSync(pubKeyPath, 'utf-8');
    const isValid = verifier.verify(pubKey, cert.signature, 'base64');

    if (!isValid) {
      console.error('❌ Signature verification failed – review.md may have been tampered with');
      process.exit(1);
    }

    console.log('🔐 Certificate verified: hash and signature match.');

    // After verification, generate compiled protocol file from review.md
    const frontmatterMatch = reviewContent.match(/^---\n([\s\S]*?)\n---\n/);
    let reviewFrontmatter = {};
    let contentWithoutFrontmatter = reviewContent;

    if (frontmatterMatch) {
      reviewFrontmatter = yaml.load(frontmatterMatch[1]);
      contentWithoutFrontmatter = reviewContent.slice(frontmatterMatch[0].length);
    }

    const compiledHash = crypto.createHash('sha256').update(reviewContent).digest('hex');

    const combinedFrontmatter = {
      ...reviewFrontmatter,
      compiled_by: 'dokugent@cli',
      compiled_at: timestamp,
      compiled_version: versionTag || timestamp,
      compiled_sha: compiledHash,
      from_review_sha: expectedHash
    };

    const frontmatterBlock = `---\n${yaml.dump(combinedFrontmatter)}---\n\n`;
    const compiledContent = `${frontmatterBlock}${contentWithoutFrontmatter}`;

    const isPlan = agent === 'plan';
    const compiledFile = path.join(baseDir, isPlan ? `compiled-plan${versionSuffix}.md` : `compiled-protocols${versionSuffix}.md`);
    fs.writeFileSync(compiledFile, compiledContent, 'utf-8');

    const tokenEstimate = Math.round(reviewContent.split(/\s+/).length * 1.5);
    console.log(`🧠 Compiled output written: ${path.relative(process.cwd(), compiledFile)}`);
    console.log(`📊 Estimated token size: ~${tokenEstimate} tokens`);

  } else if (devMode) {
    // Dev mode: build briefing from llm-load.yml files
    const llmLoadPath = path.join(dokugentPath, 'llm-load.yml');
    if (!fs.existsSync(llmLoadPath)) {
      console.error('❌ llm-load.yml not found. Aborting.');
      process.exit(1);
    }

    const llmLoad = yaml.load(fs.readFileSync(llmLoadPath, 'utf-8'));
    const lines = [];

    for (const filePath of llmLoad) {
      const absPath = path.join(dokugentPath, 'protocols', filePath);
      if (fs.existsSync(absPath)) {
        const content = fs.readFileSync(absPath, 'utf-8');
        lines.push(`### ${filePath}\n\n${content.trim()}`);
      }
    }

    const isPlan = agent === 'plan';
    const compiledFile = path.join(baseDir, isPlan ? `compiled-plan${versionSuffix}.md` : `compiled-protocols${versionSuffix}.md`);
    const content = lines.join('\n\n');
    fs.writeFileSync(compiledFile, content, 'utf-8');
    console.log(`🧠 Compiled output written: ${path.relative(process.cwd(), compiledFile)}`);

  } else if (llmAgent) {
    // LLM mode: scaffold briefing from folderGroups for the specified agent
    const supportedAgents = ['claude', 'codex'];
    if (!supportedAgents.includes(llmAgent)) {
      console.error(`❌ Unsupported agent: ${llmAgent}`);
      process.exit(1);
    }

    const folders = { ...folderGroups.core, ...folderGroups.addons };
    const outputPath = path.join(compiledDir, `${llmAgent}.protocol.md`);
    const lines = [];

    Object.entries(folders).forEach(([folder, files]) => {
      files.forEach(file => {
        const filePath = path.join(dokugentPath, folder, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          lines.push(`## ${folder}/${file}\n\n${content.trim()}\n`);
        }
      });
    });

    let tokenLimit = 6000;
    let warnIfExceeds = true;

    const llmConfigPath = path.join(dokugentPath, 'llm-load.yml');
    if (fs.existsSync(llmConfigPath)) {
      try {
        const config = yaml.load(fs.readFileSync(llmConfigPath, 'utf8'));
        tokenLimit = config.tokenLimit || tokenLimit;
        warnIfExceeds = config.warnIfExceeds !== false;
      } catch (e) {
        console.warn('⚠️ Failed to read llm-load.yml, using defaults.');
      }
    }

    const outputContent = lines.join('\n');
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    const estimatedTokens = Math.round(outputContent.length / 4);
    console.log(`🧠 Agent spec created: compiled-agent-specs/${llmAgent}.protocol.md`);
    console.log(`📊 Estimated token size: ~${estimatedTokens} tokens`);

    if (warnIfExceeds && estimatedTokens > tokenLimit) {
      console.warn(`⚠️ Warning: Briefing may exceed ideal load (${tokenLimit} tokens).
    Consider simplifying or using llm-load.yml to exclude bulky files.`);
    }

  } else {
    // Default fallback: generate compiled protocol file from review.md without cert or dev
    const reviewPath = path.join(dokugentPath, 'staging', 'review.md');
    if (!fs.existsSync(reviewPath)) {
      console.error('❌ review.md not found. Aborting.');
      process.exit(1);
    }

    const reviewContent = fs.readFileSync(reviewPath, 'utf-8');
    const frontmatterMatch = reviewContent.match(/^---\n([\s\S]*?)\n---\n/);
    let reviewFrontmatter = {};
    let contentWithoutFrontmatter = reviewContent;

    if (frontmatterMatch) {
      reviewFrontmatter = yaml.load(frontmatterMatch[1]);
      contentWithoutFrontmatter = reviewContent.slice(frontmatterMatch[0].length);
    }

    const compiledHash = crypto.createHash('sha256').update(reviewContent).digest('hex');

    const combinedFrontmatter = {
      ...reviewFrontmatter,
      compiled_by: 'dokugent@cli',
      compiled_at: timestamp,
      compiled_version: versionTag || timestamp,
      compiled_sha: compiledHash,
      from_review_sha: 'n/a'
    };

    const frontmatterBlock = `---\n${yaml.dump(combinedFrontmatter)}---\n\n`;
    const compiledContent = `${frontmatterBlock}${contentWithoutFrontmatter}`;

    const isPlan = agent === 'plan';
    const compiledFile = path.join(baseDir, isPlan ? `compiled-plan${versionSuffix}.md` : `compiled-protocols${versionSuffix}.md`);
    fs.writeFileSync(compiledFile, compiledContent, 'utf-8');

    const tokenEstimate = Math.round(reviewContent.split(/\s+/).length * 1.5);
    console.log(`🧠 Compiled output written: ${path.relative(process.cwd(), compiledFile)}`);
    console.log(`📊 Estimated token size: ~${tokenEstimate} tokens`);
  }
}