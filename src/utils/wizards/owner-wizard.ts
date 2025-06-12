import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';
import { prompt } from 'enquirer';
import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import { formatRelativePath } from '../format-path';
import { getTimestamp } from '../timestamp';

import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';

export async function promptOwnerWizard(): Promise<{
  ownerName: string;
  email?: string;
  organization?: string;
  trustLevel?: string;
}> {
  console.log('\n📛 Dokugent Keygen: Create an Owner Identity\n');

  const questions = [
    {
      type: 'input',
      name: 'ownerName',
      message: padQuestion('👤 Enter the owner\'s name:'),
      validate: (input: string) => input.trim() !== '' ? true : 'Name is required.',
    },
    {
      type: 'input',
      name: 'email',
      message: padQuestion('📧 Enter contact email:'),
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Email is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? true : 'Invalid email format.';
      },
    },
    {
      type: 'input',
      name: 'organization',
      message: padQuestion('🏢 Organization (optional):'),
    },
    {
      type: 'select',
      name: 'trustLevel',
      message: padQuestion('🔒 Trust level (optional):'),
      choices: [
        { name: 'founder', message: padQuestion('founder') },
        { name: 'developer', message: padQuestion('developer') },
        { name: 'maintainer', message: padQuestion('maintainer') },
        { name: 'reviewer', message: padQuestion('reviewer') },
        { name: 'researcher', message: padQuestion('researcher') },
        { name: 'contributor', message: padQuestion('contributor') }
      ],
      initial: -1,
    },
    {
      type: 'input',
      name: 'adminName',
      message: padQuestion('👤 Admin contact name:'),
      validate: (input: string) => input.trim() !== '' ? true : 'Admin name is required.',
    },
    {
      type: 'input',
      name: 'adminEmail',
      message: padQuestion('📧 Admin contact email:'),
      validate: (input: string) => {
        const trimmed = input.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return trimmed && emailRegex.test(trimmed) ? true : 'Valid admin email required.';
      },
    },
    {
      type: 'input',
      name: 'techName',
      message: padQuestion('👨‍💻 Tech contact name:'),
      validate: (input: string) => input.trim() !== '' ? true : 'Tech name is required.',
    },
    {
      type: 'input',
      name: 'techEmail',
      message: padQuestion('📧 Tech contact email:'),
      validate: (input: string) => {
        const trimmed = input.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return trimmed && emailRegex.test(trimmed) ? true : 'Valid tech email required.';
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: padQuestion('✅ Confirm and save owner identity?'),
      initial: true,
    }
  ];

  let answers;
  try {
    answers = await prompt<{
      ownerName: string;
      email: string;
      organization?: string;
      trustLevel?: string;
      adminName: string;
      adminEmail: string;
      techName: string;
      techEmail: string;
      confirm: boolean;
    }>(questions);
  } catch (err) {
    paddedLog('Bye...', 'Owner identity prompt cancelled or failed.', PAD_WIDTH, 'warn', 'EXITED');
    console.log()
    return {
      ownerName: '',
      email: '',
      organization: '',
      trustLevel: ''
    };
  }

  const keysDir = path.resolve('.dokugent/data/owners');
  const allFolders = await fs.readdir(keysDir);
  const keyFolders = [];

  for (const f of allFolders) {
    const stat = await fs.stat(path.join(keysDir, f));
    if (stat.isDirectory()) {
      keyFolders.push(f);
    }
  }

  const ownerSlug = answers.ownerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const OWNER_PATH = path.resolve(`.dokugent/data/owners/${ownerSlug}/owner.${ownerSlug}.json`);

  // Get current time for creation fields
  const now = new Date();

  if (answers.confirm) {
    const ownerId = createHash('sha256')
      .update(`${answers.ownerName}:${answers.email}`)
      .digest('hex');
    const ownerData: any = {
      ownerId,
      ownerName: answers.ownerName,
      email: answers.email || null,
      organization: answers.organization || null,
      trustLevel: answers.trustLevel || null,
      contacts: {
        admin: {
          name: answers.adminName,
          email: answers.adminEmail,
        },
        tech: {
          name: answers.techName,
          email: answers.techEmail,
        }
      },
      createdAt: now.toISOString(),
      createdAtDisplay: now.toLocaleString(),
      cliVersion: DOKUGENT_CLI_VERSION,
      schemaVersion: DOKUGENT_SCHEMA_VERSION,
      createdVia: "DOKUGENT_CREATED_VIA"
    };

    await fs.ensureDir(path.dirname(OWNER_PATH));
    await fs.writeJson(OWNER_PATH, ownerData, { spaces: 2 });

    // console.log(`\n🔐 Owner metadata saved:\n   .dokugent/data/owners/${ownerSlug}/owner.${ownerSlug}.json\n`);
    paddedLog('Owner metadata saved', `.dokugent/data/owners/${ownerSlug}/owner.${ownerSlug}.json`, PAD_WIDTH, 'success', 'SAVED');

    // console.log(`\n✅ Owner identity saved to .dokugent/data/owners/${ownerSlug}/latest\n`);

  } else {
    paddedLog('Bye...', 'Owner identity setup cancelled', PAD_WIDTH, 'warn');
    console.log()
  }

  return {
    ownerName: answers.ownerName,
    email: answers.email,
    organization: answers.organization,
    trustLevel: answers.trustLevel
  };
}
