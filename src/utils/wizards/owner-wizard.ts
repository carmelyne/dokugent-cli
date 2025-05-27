import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { formatRelativePath } from '../format-path';

export async function promptOwnerWizard(): Promise<void> {
  console.log('\n📛 Dokugent Owner Identity Wizard\n');

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
      message: '📧 Enter contact email (optional):',
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
      choices: ['', 'founder', 'developer', 'maintainer', 'reviewer', 'researcher', 'contributor'],
      default: '',
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: '✅ Confirm and save owner identity?',
      default: true,
    }
  ]);

  const emailSlug = (answers.email || 'anonymous').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const OWNER_PATH = path.resolve(`.dokugent/data/owners/owner.${emailSlug}.json`);

  if (await fs.pathExists(OWNER_PATH)) {
    const { confirmOverwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmOverwrite',
        message: '⚠️ An owner identity already exists. Overwrite?',
        default: false,
      }
    ]);
    if (!confirmOverwrite) {
      console.log('\n🚫 Operation cancelled.');
      return;
    }
  }

  let publicKey = null;
  try {
    const keyPath = path.resolve('.dokugent/keys/public.key');
    publicKey = await fs.readFile(keyPath, 'utf-8');
  } catch {
    publicKey = null;
  }

  if (answers.confirm) {
    const ownerData = {
      name: answers.ownerName,
      email: answers.email || null,
      organization: answers.organization || null,
      publicKey: publicKey,
      trustLevel: answers.trustLevel || null,
      createdAt: new Date().toISOString()
    };

    await fs.ensureDir(path.dirname(OWNER_PATH));
    await fs.writeJson(OWNER_PATH, ownerData, { spaces: 2 });

    console.log('\n✅ Owner identity saved to', formatRelativePath(OWNER_PATH));
  } else {
    console.log('\n❌ Owner identity setup cancelled.');
  }
}
