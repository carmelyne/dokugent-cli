import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { getTimestamp } from '../timestamp';
import { formatRelativePath } from '../format-path';

export async function promptSignerWizard(): Promise<{
  signerName: string;
  email?: string;
  organization?: string;
  trustLevel?: string;
}> {
  console.log('\n📛 Dokugent Keygen: Create a Signing Identity\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '👤 Enter the signer\'s name:',
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
      message: '✅ Confirm and save signer identity?',
      default: true,
    }
  ]);

  if (!answers.confirm) {
    console.log('\n❌ Signer identity setup cancelled.\n');
    return {
      signerName: answers.name,
      email: answers.email,
      organization: answers.organization,
      trustLevel: answers.trustLevel
    };
  }

  return {
    signerName: answers.name,
    email: answers.email,
    organization: answers.organization,
    trustLevel: answers.trustLevel
  };
}
