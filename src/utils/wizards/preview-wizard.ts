import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

export async function previewWizard(): Promise<{ agent: string, devMode: string, previewPath: string } | null> {
  const conventionDir = path.resolve(process.cwd(), '.dokugent/conventions/dev');
  const exists = await fs.pathExists(conventionDir);
  if (!exists) {
    console.log('⚠️  No conventions/dev folder found. Using default agent.');
    const previewPath = path.resolve(process.cwd(), '.dokugent/preview/specs', 'default');
    return { agent: 'default', devMode: 'codex', previewPath };
  }

  const entries = await fs.readdir(conventionDir);
  const devModes = entries
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));

  if (devModes.length === 0) {
    console.log('⚠️  No .md files found in conventions/dev. Aborting.');
    return null;
  }

  console.log('🎛️ Choose development convention:');
  devModes.forEach((mode, i) => console.log(`  ${i + 1}. ${mode}`));

  const selected = await prompt('❓ Which dev mode do you want to use? (enter number): ');
  const index = parseInt(selected, 10) - 1;

  if (isNaN(index) || index < 0 || index >= devModes.length) {
    console.log('❌ Invalid selection.');
    return null;
  }

  const devMode = devModes[index];
  const agent = 'default'; // fallback agent ID
  const previewPath = path.resolve(process.cwd(), '.dokugent/preview/specs', agent);
  return { agent, devMode, previewPath };
}