import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export function certifyBlueprint(options) {
  const { scope = '.dokugent', key } = options;

  const reviewPath = path.join(process.cwd(), scope, 'staging', 'review.md');
  const certPath = path.join(process.cwd(), scope, 'certs', 'review.cert');

  if (!fs.existsSync(reviewPath)) {
    console.error(`❌ review.md not found at ${reviewPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(key)) {
    console.error(`❌ Private key not found at ${key}`);
    process.exit(1);
  }

  const reviewContent = fs.readFileSync(reviewPath, 'utf-8');
  const hash = crypto.createHash('sha256').update(reviewContent).digest('hex');

  const privateKey = fs.readFileSync(key, 'utf-8');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(hash);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  const metadata = {
    cert_version: 1,
    signed_by: path.basename(key), // placeholder for signer ID
    signed_at: new Date().toISOString(),
    review_hash: hash,
    signature
  };

  fs.ensureDirSync(path.dirname(certPath));
  fs.writeFileSync(certPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`✅ Certified review.md. Output written to ${certPath}`);
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