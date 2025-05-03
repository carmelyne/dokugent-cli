import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export function certifyBlueprint(options) {
  const { scope = '.dokugent', key } = options;

  const reviewPlanPath = path.join(process.cwd(), scope, 'review', 'review-plan.yaml');
  const reviewProtocolsPath = path.join(process.cwd(), scope, 'review', 'review-protocols.md');
  const certPath = path.join(process.cwd(), scope, 'certs', 'review.cert');

  const isVersioned = process.argv.includes('--versioned');
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15); // e.g. 20240503T153012

  const versionsPath = path.join(process.cwd(), scope, 'versions.json');
  let versionTag = '';
  if (isVersioned && fs.existsSync(versionsPath)) {
    const versions = fs.readJsonSync(versionsPath);
    const next = versions.latest + 1;
    versionTag = `v${next}`;
  }

  const certFilename = isVersioned ? `review.${versionTag}.cert` : 'review.cert';
  const finalCertPath = path.join(process.cwd(), scope, 'certs', certFilename);

  if (!fs.existsSync(reviewPlanPath) || !fs.existsSync(reviewProtocolsPath)) {
    console.error(`❌ One or both review files not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(key)) {
    console.error(`❌ Private key not found at ${key}`);
    process.exit(1);
  }

  const reviewPlanContent = fs.readFileSync(reviewPlanPath, 'utf-8');
  const reviewProtocolsContent = fs.readFileSync(reviewProtocolsPath, 'utf-8');
  const reviewPlanHash = crypto.createHash('sha256').update(reviewPlanContent).digest('hex');
  const reviewProtocolsHash = crypto.createHash('sha256').update(reviewProtocolsContent).digest('hex');

  const privateKey = fs.readFileSync(key, 'utf-8');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(reviewPlanHash + reviewProtocolsHash);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  const metadata = {
    cert_version: 1,
    cert_version_id: versionTag || timestamp,
    signed_by: path.basename(key), // placeholder for signer ID
    signed_at: new Date().toISOString(),
    review_plan_hash: reviewPlanHash,
    review_protocols_hash: reviewProtocolsHash,
    signature
  };

  fs.ensureDirSync(path.dirname(finalCertPath));
  fs.writeFileSync(finalCertPath, JSON.stringify(metadata, null, 2), 'utf-8');

  if (isVersioned && fs.existsSync(versionsPath)) {
    const versions = fs.readJsonSync(versionsPath);
    const next = parseInt(versionTag.slice(1)); // strip 'v' and convert to int

    versions.latest = next;
    versions.history[`v${next}`] = {
      created_at: new Date().toISOString(),
      note: 'auto-tagged via certify'
    };

    fs.writeJsonSync(versionsPath, versions, { spaces: 2 });
  }

  console.log(`✅ Certified review plan and protocols. Output written to ${finalCertPath}`);
}

import { execSync } from 'child_process';

export function generateKeypair(name) {
  const keysDir = path.join(process.cwd(), '.dokugent', 'keys');
  const privKeyPath = path.join(keysDir, 'id_doku_priv.pem');
  const pubKeyPath = path.join(keysDir, 'id_doku_pub.pem');

  fs.ensureDirSync(keysDir);

  console.log(`🔐 Generating RSA keypair for ${name}...`);

  try {
    execSync(`openssl genpkey -algorithm RSA -out ${privKeyPath} -pkeyopt rsa_keygen_bits:2048`);
    execSync(`openssl rsa -pubout -in ${privKeyPath} -out ${pubKeyPath}`);
  } catch (err) {
    console.error('❌ Failed to generate keypair:', err.message);
    process.exit(1);
  }

  const signersFile = path.join(keysDir, 'signers.yml');
  const signerEntry = `- id: ${name}\n  pubkey_file: id_doku_pub.pem\n  created_at: ${new Date().toISOString()}\n`;

  fs.appendFileSync(signersFile, signerEntry);
  console.log(`✅ Keypair created at ${keysDir}`);
}