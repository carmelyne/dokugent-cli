/**
 * @file keygen.ts
 * @description Generates an Ed25519 keypair for an agent and stores it along with metadata in `.dokugent/keys/`.
 */
import { generateKeyPairSync, createHash } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import { formatRelativePath } from '../../utils/format-path';
import { promptSignerWizard } from '../../utils/wizards/signer-wizard';
import { getTimestamp } from '../../utils/timestamp';
import { runShowKeygen } from './show';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';

interface SignerData {
  signerName: string;
  email?: string;
  organization?: string;
  trustLevel?: string;
  department?: string;
  avatar?: string;
  location?: string;
  cliVersion?: string;
  schemaVersion?: string;
  createdVia?: string;
  signerId?: string;
  revoked?: boolean;
  createdAt?: string;
  createdAtDisplay?: string;
  publicKey?: string;
  fingerprint?: string;
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
export async function runKeygenCommand(args: string[] = []) {
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
  await fs.ensureDir(path.join(keysDir, 'signers'));

  const wizardResult = await promptSignerWizard();
  const signerData: SignerData = {
    signerName: wizardResult.signerName,
    email: wizardResult.email,
    organization: wizardResult.organization,
    trustLevel: wizardResult.trustLevel || 'unverified',
    department: wizardResult.department,
    avatar: wizardResult.avatar,
    location: wizardResult.location,
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    signerId: wizardResult.signerId || '',
    revoked: false,
    createdAt: wizardResult.createdAt || new Date().toISOString(),
    createdAtDisplay: wizardResult.createdAtDisplay || new Date().toLocaleString()
  };

  if (!signerData?.signerName) {
    console.error('❌ No signer name provided. Cannot generate keypair.');
    return;
  }

  const name = signerData.signerName.toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

  const timestamp = getTimestamp();
  const keyFolder = path.join(keysDir, 'signers', name, timestamp);
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
    signerName: signerData.signerName,
    email: signerData.email || '',
    organization: signerData.organization || '',
    department: signerData.department || '',
    trustLevel: signerData.trustLevel || '',
    avatar: signerData.avatar || '',
    location: signerData.location || '',
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    signerId: signerData.signerId || '',
    revoked: false,
    createdAt: signerData.createdAt || new Date().toISOString(),
    createdAtDisplay: signerData.createdAtDisplay || new Date().toLocaleString(),
    publicKey,
    fingerprint
  };

  // Removed creation of signerFilePath and writing signer.json directly under signers

  await fs.writeJson(metadataPath, metadata, { spaces: 2 });

  // Always update latest
  const symlinkLatest = path.join(keysDir, 'signers', name!, 'latest');
  await fs.remove(symlinkLatest);
  await fs.ensureSymlink(keyFolder, symlinkLatest, 'dir');

  const relativePath = path.relative(process.cwd(), keyFolder);
  // console.log(`\n🔐 Signer keypair and metadata saved to:\n   ${relativePath}\n`);
  console.log();
  paddedLog('Signer keypair and metadata saved to...', ` ${relativePath}`, PAD_WIDTH, 'success', 'SAVED');
  console.log();
}
