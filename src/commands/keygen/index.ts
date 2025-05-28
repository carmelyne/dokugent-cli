/**
 * @file keygen.ts
 * @description Generates an Ed25519 keypair for an agent and stores it along with metadata in `.dokugent/keys/`.
 */
import { generateKeyPairSync, createHash } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import { formatRelativePath } from '../../utils/format-path';
import { promptOwnerWizard } from '../../utils/wizards/owner-wizard';
import { getTimestamp } from '../../utils/timestamp';
import { runShowKeygen } from './show';

interface OwnerData {
  name: string;
  email?: string;
  organization?: string;
  trustLevel?: string;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

/**
 * Generates a named Ed25519 keypair for an agent.
 *
 * Responsibilities:
 * - Prompts for agent name or uses default.
 * - Writes `.private.pem`, `.public.pem`, and `.meta.json` into `.dokugent/keys/`.
 * - Computes and stores the SHA256 fingerprint of the public key.
 *
 * @returns {Promise<void>}
 */
export async function keygenCommand(args: string[] = []) {
  const knownFlags = ['--show'];
  const validArgs = args.filter(arg =>
    !arg.startsWith('--') &&
    !knownFlags.includes(arg) &&
    arg !== 'keygen'
  );
  const nameFromArg = validArgs.length > 0 ? validArgs[0] : undefined;

  const flags = new Set(args.filter(arg => arg.startsWith('--')));

  if (flags.has('--show')) {
    await runShowKeygen(args);
    return;
  }

  const keysDir = path.join(process.cwd(), '.dokugent', 'keys');
  await fs.ensureDir(keysDir);

  const ownerData: OwnerData = await promptOwnerWizard();
  const name = ownerData?.name || 'agent';

  const timestamp = getTimestamp();
  const keyFolder = path.join(keysDir, 'owners', name, timestamp);
  await fs.ensureDir(keyFolder);

  const privateKeyPath = path.join(keyFolder, `${name}.private.pem`);
  const publicKeyPath = path.join(keyFolder, `${name}.public.pem`);
  const metadataPath = path.join(keyFolder, `${name}.meta.json`);

  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  await fs.writeFile(privateKeyPath, privateKey);
  await fs.writeFile(publicKeyPath, publicKey);

  const fingerprint = createHash('sha256').update(publicKey).digest('hex');
  const metadata = {
    name: ownerData.name,
    email: ownerData.email || '',
    organization: ownerData.organization || '',
    publicKey,
    trustLevel: ownerData.trustLevel || '',
    createdAt: new Date().toISOString()
  };

  await fs.writeJson(metadataPath, metadata, { spaces: 2 });

  // Always update latest
  const symlinkLatest = path.join(keysDir, 'owners', name!, 'latest');
  await fs.remove(symlinkLatest);
  await fs.ensureSymlink(keyFolder, symlinkLatest, 'dir');
}
