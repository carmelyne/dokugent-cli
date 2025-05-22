

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { getTimestamp } from '../utils/timestamp';
import { confirmAndWriteFile } from '../utils/fs-utils';

export async function runComplianceWizard(agentId: string) {
  console.log(`\n🛡️  Filling out compliance fields for: ${agentId}\n`);

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'contactName',
      message: "Contact person's full name:",
      validate: (input: string) => input.trim() !== '' || 'Required'
    },
    {
      type: 'input',
      name: 'contactEmail',
      message: 'Contact email address:',
      validate: (input: string) =>
        /\S+@\S+\.\S+/.test(input) || 'Must be a valid email'
    },
    {
      type: 'input',
      name: 'dataRetention',
      message: 'How long is data retained? (e.g., 7 days, indefinite)',
      validate: (input: string) => input.trim() !== '' || 'Required'
    },
    {
      type: 'checkbox',
      name: 'dataSensitivity',
      message: 'What sensitive data may be handled?',
      choices: ['location', 'biometrics', 'identifiers', 'health', 'financial']
    },
    {
      type: 'list',
      name: 'legalBasis',
      message: 'Legal basis for data processing:',
      choices: [
        'consent',
        'contract',
        'legal_obligation',
        'vital_interest',
        'public_task',
        'legitimate_interest'
      ]
    },
    {
      type: 'input',
      name: 'authorizedUsers',
      message: 'Authorized user roles (comma-separated):',
      filter: (input: string) => input.split(',').map(s => s.trim()).filter(Boolean)
    }
  ]);

  const output = {
    contact: {
      name: answers.contactName,
      email: answers.contactEmail
    },
    dataRetention: answers.dataRetention,
    dataSensitivity: answers.dataSensitivity,
    legalBasis: answers.legalBasis,
    authorizedUsers: answers.authorizedUsers
  };

  const compliancePath = path.resolve('.dokugent/data/compliance', agentId, 'compliance.json');
  await confirmAndWriteFile(compliancePath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Compliance metadata saved to:\n   \x1b[34m.dokugent/data/compliance/${agentId}/compliance.json\x1b[0m\n`);
}