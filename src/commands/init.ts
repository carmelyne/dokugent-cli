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
  await promptInitWizard(useDefaultsOnly);

  // Place a default README.md in the newly created agent folder
  const readmeContent = `# Agent Scaffold

This agent was initialized using [Dokugent CLI](https://dokugent.com)

📦 GitHub repo: https://github.com/carmelyne/dokugent-cli
`;

  const readmePath = path.resolve('.dokugent/README.md');
  await confirmAndWriteFile(readmePath, readmeContent);

  // Final summary log to guide the user and confirm success
  console.log('\n🎉 Dokugent agent scaffolding complete!\n');
  console.log('📁 Output directory: .dokugent');
  console.log('📄 Files created:');
  console.log('   - README.md');
  console.log('   - agents/init/<agentName>/agent-spec.md');
  console.log('   - agents/init/<agentName>/agent-spec.json');
  console.log('   - agents/init/<agentName>/tool-list.md');
  console.log('🔒 Denylist overrides saved to: .dokugent/overrides/blacklist/');
  console.log('\n✅ You can now continue with: dokugent plan');
}