import fs from 'fs-extra';
import path from 'path';

const planPath = path.join(process.cwd(), '.dokugent', 'plan');

export async function planLs() {
  if (!(await fs.pathExists(planPath))) {
    console.log('❌ No plan folder found.');
    return;
  }

  const entries = await fs.readdir(planPath);
  const folders: string[] = [];
  const symlinks: string[] = [];

  for (const entry of entries) {
    const full = path.join(planPath, entry);
    const stat = await fs.lstat(full);
    if (stat.isSymbolicLink()) symlinks.push(entry);
    else if (stat.isDirectory()) folders.push(entry);
  }

  console.log(`\n📁 Plan Steps (${folders.length}):\n`);
  folders.forEach(f => console.log(`  📂 ${f}`));

  console.log(`\n🔗 Symlinks (${symlinks.length}):\n`);
  for (const name of symlinks) {
    const target = await fs.readlink(path.join(planPath, name));
    console.log(`  🌳 ${name} → ${path.basename(target)}`);
  }
  console.log(`\n`);
}