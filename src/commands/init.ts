import fs from 'fs-extra';
import path from 'path';
import { promptInitWizard } from '../utils/wizards/init-wizard';
import { confirmAndWriteFile } from '../utils/fs-utils';

export async function runInitCommand(): Promise<void> {
  const useDefaultsOnly = process.argv.includes('--yes');

  console.log("⚙️ Running dokugent init...");
  const baseDirs = [
    '.dokugent/plan',
    '.dokugent/criteria',
    '.dokugent/conventions',
    '.dokugent/preview',
    '.dokugent/certified',
    '.dokugent/compiled',
    '.dokugent/reports',
    '.dokugent/logs'
  ];

  for (const dir of baseDirs) {
    await fs.ensureDir(path.resolve(dir));
  }
  // Default answers for --yes (no wizard)
  const defaultAnswers = {
    agentName: 'default-agent',
    description: 'Assist with general research and summarization.',
    roles: ['researcher', 'validator'],
    protocols: ['design-intent'],
    outputs: ['JSON'],
    understands: ['yaml'],
    allowExternalFiles: false,
    requireApproval: true,
    denylist: ['blacklist-health.txt'],
  };

  // Use defaults or run wizard
  const answers = useDefaultsOnly ? defaultAnswers : await promptInitWizard();

  const agentFolder = path.join('.dokugent/agent-info/agents/agent-spec/init', answers.agentName);

  // Place a default README.md in the newly created agent folder
  const readmeContent = `# Agent Scaffold

This agent was initialized using [Dokugent CLI](https://dokugent.com)

📦 GitHub repo: https://github.com/carmelyne/dokugent-cli
`;

  const readmePath = path.resolve('.dokugent/README.md');
  await confirmAndWriteFile(readmePath, readmeContent);

  // Ensure agentFolder exists before writing files
  await fs.ensureDir(path.resolve(agentFolder));

  // Generate static file contents
  const specMd = `# Agent Spec: ${answers.agentName}\n\n${answers.description}`;
  const specJson = JSON.stringify(answers, null, 2);
  const toolListMd = `# Tool List for ${answers.agentName}\n\n- summarize-tool\n- validate-tool`;

  // Write agent files to the correct agentFolder path
  if (useDefaultsOnly) {
    await confirmAndWriteFile(path.join(agentFolder, 'agent-spec.md'), specMd);
    await confirmAndWriteFile(path.join(agentFolder, 'agent-spec.json'), specJson);
    await confirmAndWriteFile(path.join(agentFolder, 'tool-list.md'), toolListMd);
  }

  // Final summary log to guide the user and confirm success
  console.log('\n🎉 Dokugent agent scaffolding complete!\n');
  console.log('📁 Output directory: .dokugent');
  console.log('📄 Files created:');
  console.log(`   - README.md`);
  console.log(`   - ${path.join(agentFolder, 'agent-spec.md')}`);
  console.log(`   - ${path.join(agentFolder, 'agent-spec.json')}`);
  console.log(`   - ${path.join(agentFolder, 'tool-list.md')}`);
  console.log('🔒 Denylist overrides saved to: .dokugent/overrides/blacklist/');
  console.log('\n✅ You can now continue with: dokugent plan');
}