import { generateKeyPairSync, createHash } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

export async function keygenCommand() {
  const keysDir = path.join(process.cwd(), '.dokugent', 'keys');
  await fs.ensureDir(keysDir);

  const name = await prompt('🧑 What is the name of this key/agent? (e.g. carmelyne-thompson, default: agent): ') || 'agent';

  const privateKeyPath = path.join(keysDir, `${name}.private.pem`);
  const publicKeyPath = path.join(keysDir, `${name}.public.pem`);
  const metadataPath = path.join(keysDir, `${name}.meta.json`);

  if (await fs.pathExists(privateKeyPath) || await fs.pathExists(publicKeyPath)) {
    console.log('❌ Keypair already exists. Use a different name or delete the existing files.');
    return;
  }

  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  await fs.writeFile(privateKeyPath, privateKey);
  await fs.writeFile(publicKeyPath, publicKey);

  const fingerprint = createHash('sha256').update(publicKey).digest('hex');
  const metadata = {
    name,
    created_at: new Date().toISOString(),
    algorithm: 'ed25519',
    fingerprint
  };

  await fs.writeJson(metadataPath, metadata, { spaces: 2 });

  console.log(`🔐 Keypair generated for "${name}":
  - 🗝️  Public:  ${publicKeyPath}
  - 🔒 Private: ${privateKeyPath}
  - 📄 Metadata: ${metadataPath}`);
}