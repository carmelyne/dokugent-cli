import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import crypto from 'crypto';

export async function promptComplianceWizard() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'dataRetention',
      message: 'How long is data retained? (e.g., 7 days, indefinite)',
      validate: (input: string) => input.trim() !== '' || 'Required',
      default: '30 days',
    },
    {
      type: 'checkbox',
      name: 'dataSensitivity',
      message: 'What sensitive data may be handled?',
      choices: ['location', 'biometrics', 'identifiers', 'health', 'financial'],
      default: ['identifiers', 'location'],
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
      ],
      default: 'consent',
    },
    {
      type: 'input',
      name: 'authorizedUsers',
      message: 'Authorized user roles (comma-separated):',
      filter: (input: string) => input.split(',').map(s => s.trim()).filter(Boolean),
      default: 'admin, reviewer',
    },
    {
      type: 'input',
      name: 'purpose',
      message: 'Purpose for processing personal data (optional):',
      default: ''
    },
    {
      type: 'checkbox',
      name: 'dataSources',
      message: 'What sources does this agent get data from? (optional)',
      choices: ['user input', 'external API', 'database', 'logs', 'uploaded files'],
      default: ['user input'],
    },
    {
      type: 'confirm',
      name: 'transfersOutsideJurisdiction',
      message: 'Does this agent transfer data outside your local jurisdiction? (optional)',
      default: false
    },
    {
      type: 'confirm',
      name: 'usesProfiling',
      message: 'Does this agent use profiling or automated decision-making? (optional)',
      default: false
    },
    {
      type: 'list',
      name: 'selfAssessedRisk',
      message: 'What is the self-assessed risk level of this agent? (optional)',
      choices: ['Low', 'Moderate', 'High'],
      default: 'Low'
    },
    {
      type: 'checkbox',
      name: 'supportsDSAR',
      message: 'Which data subject rights can this agent support? (optional)',
      choices: ['access', 'correction', 'deletion', 'portability', 'objection', 'none'],
      default: ['access', 'deletion'],
    }
  ]);

  const signerFolder = '.dokugent/keys/signers';
  const signerList = await fs.readdir(signerFolder);
  const filteredSigners = signerList.filter(name => name !== '.DS_Store');
  let selectedSigner = filteredSigners[0];

  if (filteredSigners.length > 1) {
    const signerAnswer = await inquirer.prompt([
      {
        type: 'select',
        name: 'selectedSigner',
        message: 'Select compliance signer profile:',
        choices: filteredSigners
      }
    ]);
    selectedSigner = signerAnswer.selectedSigner;
  }

  const metaPath = path.join(signerFolder, selectedSigner, 'latest', `${selectedSigner}.meta.json`);
  const meta = await fs.readJson(metaPath);

  return {
    ...answers,
    complianceSigner: {
      signerId: `${meta.email}#${meta.fingerprint}`,
      publicKey: meta.publicKey,
      email: meta.email,
      fingerprint: meta.fingerprint ?? null,
      name: meta.name || selectedSigner,
      keyVersion: path.basename(path.dirname(metaPath)),
      sha256: meta.sha256 || crypto.createHash('sha256').update(meta.publicKey).digest('hex')
    }
  };
}
