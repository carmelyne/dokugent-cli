import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

// Compile agent briefing, with optional certificate verification
export async function compileBriefing(agent) {
  const dokugentPath = path.join(process.cwd(), '.dokugent');
  const reviewPath = path.join(dokugentPath, 'staging', 'review.md');
  const certPath = path.join(dokugentPath, 'certs', 'review.cert');
  const pubKeyPath = path.join(dokugentPath, 'keys', 'id_doku_pub.pem');

  // Require cert mode
  const certRequired = process.argv.includes('--prod');
  const devMode = process.argv.includes('--dev');

  let cert = null;

  if (certRequired) {
    if (!fs.existsSync(reviewPath) || !fs.existsSync(certPath) || !fs.existsSync(pubKeyPath)) {
      console.error('❌ Missing review.md, review.cert, or public key for verification');
      process.exit(1);
    }

    const reviewContent = fs.readFileSync(reviewPath, 'utf-8');
    const currentHash = crypto.createHash('sha256').update(reviewContent).digest('hex');

    cert = JSON.parse(fs.readFileSync(certPath, 'utf-8'));
    console.log('🧾 Expected hash:', cert.review_hash);
    console.log('📄 Current hash: ', currentHash);

    if (cert.review_hash !== currentHash) {
      console.error('❌ review.md has changed since certification – hash mismatch');
      process.exit(1);
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(currentHash);
    verifier.end();

    const pubKey = fs.readFileSync(pubKeyPath, 'utf-8');
    const isValid = verifier.verify(pubKey, cert.signature, 'base64');

    if (!isValid) {
      console.error('❌ Signature verification failed – review.md may have been tampered with');
      process.exit(1);
    }

    console.log('🔐 Certificate verified: hash and signature match.');
  }

  // Fallback if not requiring cert, read review.md directly
  const reviewContent = fs.readFileSync(reviewPath, 'utf-8');

  const frontmatterMatch = reviewContent.match(/^---\n([\s\S]*?)\n---\n/);
  let reviewFrontmatter = {};
  let contentWithoutFrontmatter = reviewContent;

  if (frontmatterMatch) {
    const yaml = await import('js-yaml');
    reviewFrontmatter = yaml.load(frontmatterMatch[1]);
    contentWithoutFrontmatter = reviewContent.slice(frontmatterMatch[0].length);
  }

  const compiledDir = path.join(dokugentPath, 'compiled-agent-specs');
  const compiledFile = path.join(compiledDir, `${agent}.protocol.md`);

  fs.ensureDirSync(compiledDir);

  const compiledHash = crypto.createHash('sha256').update(reviewContent).digest('hex');
  const timestamp = new Date().toISOString();

  const combinedFrontmatter = {
    ...reviewFrontmatter,
    compiled_by: 'dokugent@cli',
    compiled_at: timestamp,
    compiled_sha: compiledHash,
    from_review_sha: certRequired ? cert.review_hash : 'n/a'
  };

  const yaml = await import('js-yaml');
  const frontmatterBlock = `---\n${yaml.dump(combinedFrontmatter)}---\n\n`;
  const compiledContent = `${frontmatterBlock}${contentWithoutFrontmatter}`;

  fs.writeFileSync(compiledFile, compiledContent, 'utf-8');

  const tokenEstimate = Math.round(reviewContent.split(/\s+/).length * 1.5);
  console.log(`🧠 Agent briefing compiled: ${path.relative(process.cwd(), compiledFile)}`);
  console.log(`📊 Estimated token size: ~${tokenEstimate} tokens`);

  if (devMode) {
    const llmLoadPath = path.join(dokugentPath, 'llm-load.yml');
    if (!fs.existsSync(llmLoadPath)) {
      console.error('❌ review.md not found and no llm-load.yml available. Aborting.');
      process.exit(1);
    }

    const yaml = await import('js-yaml');
    const llmLoad = yaml.load(fs.readFileSync(llmLoadPath, 'utf-8'));
    const lines = [];

    for (const filePath of llmLoad) {
      const absPath = path.join(dokugentPath, 'protocols', filePath);
      if (fs.existsSync(absPath)) {
        const content = fs.readFileSync(absPath, 'utf-8');
        lines.push(`### ${filePath}\n\n${content.trim()}`);
      }
    }

    const content = lines.join('\n\n');
    fs.writeFileSync(compiledFile, content, 'utf-8');
    console.log('🧪 Dev compile from llm-load.yml completed.');
  }
}

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { folderGroups } from '../config/scaffold-groups.js';

function scaffoldAgentBriefing(llm = 'claude') {
  const supportedAgents = ['claude', 'codex'];
  if (!supportedAgents.includes(llm)) {
    console.error(`❌ Unsupported agent: ${llm}`);
    return;
  }

  const basePath = path.resolve('.dokugent/compiled-agent-specs');
  fs.ensureDirSync(basePath);

  const folders = { ...folderGroups.core, ...folderGroups.addons };
  const outputPath = path.join(basePath, `${llm}.md`);
  const lines = [];

  Object.entries(folders).forEach(([folder, files]) => {
    files.forEach(file => {
      const filePath = path.join('.dokugent', folder, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        lines.push(`## ${folder}/${file}\n\n${content.trim()}\n`);
      }
    });
  });

  let tokenLimit = 6000;
  let warnIfExceeds = true;

  const llmConfigPath = path.join('.dokugent', 'llm-load.yml');
  if (fs.existsSync(llmConfigPath)) {
    try {
      const config = yaml.load(readFileSync(llmConfigPath, 'utf8'));
      tokenLimit = config.tokenLimit || tokenLimit;
      warnIfExceeds = config.warnIfExceeds !== false;
    } catch (e) {
      console.warn('⚠️ Failed to read llm-load.yml, using defaults.');
    }
  }

  const outputContent = lines.join('\n');
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  const estimatedTokens = Math.round(outputContent.length / 4);
  console.log(`🧠 Agent spec created: compiled-agent-specs/${llm}.md`);
  console.log(`📊 Estimated token size: ~${estimatedTokens} tokens`);

  if (warnIfExceeds && estimatedTokens > tokenLimit) {
    console.warn(`⚠️ Warning: Briefing may exceed ideal load (${tokenLimit} tokens).
    Consider simplifying or using llm-load.yml to exclude bulky files.`);
  }
}

export { scaffoldAgentBriefing };