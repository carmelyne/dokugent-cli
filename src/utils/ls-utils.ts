/**
 * @file ls-utils.ts
 * @description Utility function for listing versioned plan folders and active symlinks.
 * Supports legacy and modern plan directory layouts.
 */
import fs from 'fs-extra';
import path from 'path';

/**
 * Lists all available plan versions and symlinks in the plan directory.
 *
 * Responsibilities:
 * - Searches for plan directory in `.dokugent/plan` or legacy `plan/` fallback.
 * - Separates folders and symlinks for display.
 * - Resolves symlink targets and formats the output.
 *
 * @returns {Promise<void>}
 */
export async function planLs() {
  // Try both legacy and new plan locations
  const cwd = process.cwd();
  const possiblePlanPaths = [
    path.join(cwd, '.dokugent', 'plan'),
    path.join(cwd, 'plan'),
  ];
  let planPath: string | null = null;
  for (const p of possiblePlanPaths) {
    if (await fs.pathExists(p)) {
      planPath = p;
      break;
    }
  }
  if (!planPath) {
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