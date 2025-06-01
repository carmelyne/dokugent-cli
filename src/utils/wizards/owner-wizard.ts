import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { formatRelativePath } from '../format-path';
import { getTimestamp } from '../timestamp';

export async function promptOwnerWizard(): Promise<{
  ownerName: string;
  email?: string;
  organization?: string;
  trustLevel?: string;
}> {
  console.log('\n📛 Dokugent Keygen: Create an Owner Identity\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'ownerName',
      message: '👤 Enter the owner\'s name:',
      validate: (input) => input.trim() !== '' || 'Name is required.',
    },
    {
      type: 'input',
      name: 'email',
      message: '📧 Enter contact email:',
      validate: (input) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Email is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) || 'Invalid email format.';
      },
    },
    {
      type: 'input',
      name: 'organization',
      message: '🏢 Organization (optional):',
    },
    {
      type: 'list',
      name: 'trustLevel',
      message: '🔒 Trust level (optional):',
      choices: ['founder', 'developer', 'maintainer', 'reviewer', 'researcher', 'contributor'],
      default: '',
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: '✅ Confirm and save owner identity?',
      default: true,
    }
  ]);

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

  if (answers.confirm) {
    const ownerData: any = {
      ownerName: answers.ownerName,
      email: answers.email || null,
      organization: answers.organization || null,
      trustLevel: answers.trustLevel || null,
      createdAt: getTimestamp(),
    };

    await fs.ensureDir(path.dirname(OWNER_PATH));
    await fs.writeJson(OWNER_PATH, ownerData, { spaces: 2 });

    console.log(`\n🔐 Owner metadata saved:\n   .dokugent/data/owners/${ownerSlug}/owner.${ownerSlug}.json\n`);

    // console.log(`\n✅ Owner identity saved to .dokugent/data/owners/${ownerSlug}/latest\n`);

  } else {
    console.log('\n❌ Owner identity setup cancelled.\n');
  }

  return {
    ownerName: answers.ownerName,
    email: answers.email,
    organization: answers.organization,
    trustLevel: answers.trustLevel
  };
}
