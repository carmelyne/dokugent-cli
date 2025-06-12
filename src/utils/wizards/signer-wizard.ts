import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import fs from 'fs-extra';
import path from 'path';
import crypto, { createHash } from 'crypto';
import { getTimestamp } from '../timestamp';
import { formatRelativePath } from '../format-path';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';

export async function promptSignerWizard(): Promise<{
  signerName: string;
  email?: string;
  organization?: string;
  department?: string;
  trustLevel?: string;
  avatar?: string;
  location?: string;
  cliVersion: string;
  schemaVersion: string;
  createdVia: string;
  signerId: string;
  revoked: boolean;
  createdAt: string;
  createdAtDisplay: string;
}> {

  console.log()
  paddedCompact('dokugent keygen initialized...', '', PAD_WIDTH, 'info');
  // console.log('\n📛 Dokugent Keygen: Create a Signing Identity\n');
  paddedSub('', glyphs.arrowRight + ' Create a Signing Identity');

  const now = new Date();
  const schemaVersion = '0.1';

  let name, email, organization, department, trustLevel, avatar, location, confirm;
  try {
    ({ name, email, organization, department, trustLevel, avatar, location, confirm } = await prompt<{
      name: string;
      email: string;
      organization?: string;
      department?: string;
      trustLevel?: string;
      avatar?: string;
      location?: string;
      confirm: boolean;
    }>([
      {
        type: 'input',
        name: 'name',
        message: padQuestion("Enter the signer's name: "),
        validate: (input: any) => input.trim() !== '' || 'Name is required.',
        result: (input: string) => input.trim()
      },
      {
        type: 'input',
        name: 'email',
        message: padQuestion('Enter contact email:'),
        validate: (input: any) => {
          const trimmed = input.trim();
          if (!trimmed) return 'Email is required.';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(trimmed) || 'Invalid email format.';
        }
      },
      {
        type: 'input',
        name: 'organization',
        message: padQuestion('Organization (optional):')
      },
      {
        type: 'input',
        name: 'department',
        message: padQuestion('Department (optional):')
      },
      {
        type: 'select',
        name: 'trustLevel',
        message: padQuestion('Trust level (optional):'),
        choices: [
          { name: 'founder', message: padQuestion('founder') },
          { name: 'developer', message: padQuestion('developer') },
          { name: 'maintainer', message: padQuestion('maintainer') },
          { name: 'reviewer', message: padQuestion('reviewer') },
          { name: 'researcher', message: padQuestion('researcher') },
          { name: 'contributor', message: padQuestion('contributor') }
        ]
      },
      {
        type: 'input',
        name: 'avatar',
        message: padQuestion('Avatar URL (optional):'),
        initial: '',
        result: (input: string) => input.trim().replace(/^http:\/\//i, 'https://')
      },
      {
        type: 'input',
        name: 'location',
        message: padQuestion('Location (City, Country - optional):'),
        initial: ''
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: padQuestion('Confirm and save signer identity?')
      }
    ]));
  } catch (err) {
    paddedLog('Signer identity setup was cancelled or failed unexpectedly.', '', 12, 'warn', 'EXITED');
    process.exit(1);
  }

  const signerId = createHash('sha256')
    .update(`${name}:${email}`)
    .digest('hex');

  if (!confirm) {
    paddedLog('Signer identity setup cancelled.', '', 12, 'warn', 'CANCELLED');
    return {
      signerName: name,
      email: email,
      organization: organization,
      department: department,
      trustLevel: trustLevel,
      avatar: avatar,
      location: location,
      cliVersion: DOKUGENT_CLI_VERSION,
      schemaVersion: DOKUGENT_SCHEMA_VERSION,
      createdVia: DOKUGENT_CREATED_VIA,
      signerId,
      revoked: false,
      createdAt: now.toISOString(),
      createdAtDisplay: now.toLocaleString()
    };
  }

  const signerData = {
    signerName: name,
    email,
    organization,
    department,
    trustLevel,
    avatar,
    location,
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    signerId,
    revoked: false,
    createdAt: now.toISOString(),
    createdAtDisplay: now.toLocaleString()
  };

  const savePath = path.join(process.cwd(), '.dokugent', 'signers', `${signerId}.json`);
  await fs.ensureDir(path.dirname(savePath));
  await fs.writeJson(savePath, signerData, { spaces: 2 });

  return signerData;
}
