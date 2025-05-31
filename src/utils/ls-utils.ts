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

/**
 * Sets the specified agent as the current symlink target.
 *
 * @param {string} slug - The folder name of the agent to set as current.
 */
export async function setAgentCurrent(slug: string): Promise<void> {
  const agentDir = path.join('.dokugent', 'data', 'agents');
  const target = path.join(agentDir, slug);
  const symlink = path.join(agentDir, 'current');

  if (!(await fs.pathExists(target))) {
    throw new Error(`❌ Agent folder does not exist: ${slug}`);
  }

  try {
    await fs.remove(symlink);
  } catch { }

  await fs.symlink(slug, symlink); // relative path
  console.log(`\n🟢 Current agent set to: ${slug}\n`);
}

/**
 * Lists all available agent folders and symlinks in the agents directory.
 *
 * Shows:
 * - current (symlink)
 * - latest (symlink, if present)
 * - all other agent versions
 */
export async function agentLs() {
  const cwd = process.cwd();
  const agentPath = path.join(cwd, '.dokugent', 'data', 'agents');

  if (!(await fs.pathExists(agentPath))) {
    console.log('❌ No agents directory found.');
    return;
  }

  const entries = await fs.readdir(agentPath);
  const folders: string[] = [];
  const symlinks: string[] = [];

  for (const entry of entries) {
    const full = path.join(agentPath, entry);
    const stat = await fs.lstat(full);
    if (stat.isSymbolicLink()) symlinks.push(entry);
    else if (stat.isDirectory()) folders.push(entry);
  }

  console.log(`\n🧠 Available Agents (${folders.length}):\n`);
  folders.forEach(f => console.log(`  📂 ${f}`));

  console.log(`\n🔗 Symlinks (${symlinks.length}):\n`);
  for (const name of symlinks) {
    const target = await fs.readlink(path.join(agentPath, name));
    console.log(`  🌳 ${name} → ${path.basename(target)}`);
  }
  console.log(`\n`);
}

/**
 * Resolves the active path from a given type's data directory, using `current` or `latest` symlinks.
 *
 * @param type - The data type to resolve (e.g. 'agents', 'plans', 'criteria', 'conventions')
 * @returns Full real path to the resolved folder or null if neither symlink exists
 */
export async function resolveActivePath(type: 'agents' | 'plans' | 'criteria' | 'conventions'): Promise<string | null> {
  const baseDir = path.resolve('.dokugent/data', type);
  const currentPath = path.join(baseDir, 'current');
  const latestPath = path.join(baseDir, 'latest');

  if (await fs.pathExists(currentPath)) {
    return await fs.realpath(currentPath);
  }

  if (await fs.pathExists(latestPath)) {
    return await fs.realpath(latestPath);
  }

  // Special case for conventions: check nested folders (e.g., dev/latest, qa/latest, etc.)
  if (type === 'conventions') {
    const subdirs = await fs.readdir(baseDir);
    for (const dir of subdirs) {
      const candidate = path.join(baseDir, dir, 'latest');
      if (await fs.pathExists(candidate)) {
        return await fs.realpath(candidate);
      }
    }
  }

  return null;
}
