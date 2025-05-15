import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const planDir = path.join(process.cwd(), '.dokugent', 'plan');

(async () => {
  try {
    console.log('🧪 Testing: dokugent plan (interactive wizard with mock input)');

    // Clean up previous test if any
    await fs.remove(planDir);

    execSync(`yes "" | ts-node bin/dokugent.ts plan`, { stdio: 'inherit' });

    const folders = await fs.readdir(planDir);
    const symlinks = folders.filter((name) =>
      fs.lstatSync(path.join(planDir, name)).isSymbolicLink()
    );

    if (folders.length && symlinks.includes('summarize_input')) {
      console.log('✅ dokugent plan test passed.');
    } else {
      console.error('❌ dokugent plan test failed. No symlink or folder detected.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ dokugent plan test errored:', err);
    process.exit(1);
  }
})();