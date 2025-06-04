/**
 * @file ls-utils.ts
 * @description Utility function for listing versioned plan folders and active symlinks.
 * Supports legacy and modern plan directory layouts.
 */
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault } from '@src/utils/cli/ui';
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
    paddedLog('Uh oh...', 'No plan directory found.', PAD_WIDTH, 'warn');
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

  //planLS supposedly
  paddedDefault("Available Plan Steps", `(${folders.length})`, PAD_WIDTH, 'magenta', 'PLANS');
  paddedSub('', folders.map(f => `${glyphs.arrowRight} ${f}`).join('\n'));

  paddedDefault("Symlinks", `(${symlinks.length})`, PAD_WIDTH, 'blue', '🔗');
  const symlinkLines = await Promise.all(
    symlinks.map(async name => {
      const target = await fs.readlink(path.join(planPath, name));
      return `${glyphs.symlink} ${name} → ${target}`;
    })
  );
  paddedSub('', symlinkLines.join('\n'));
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
  console.log()
  paddedDefault(`Current agent set to`, `${slug}`, PAD_WIDTH, 'success', 'AGENT');
  console.log()
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
    paddedLog('Uh oh...', 'No agents directory found.', PAD_WIDTH, 'warn');
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

  console.log();
  paddedLog('dokugent agent list', '', PAD_WIDTH, 'info');
  console.log();
  paddedDefault("Available Agents", `(${folders.length})`, PAD_WIDTH, 'magenta', 'AGENTS');
  // console.log(`\n🧠 Available Agents (${folders.length}):\n`);
  paddedSub('', folders.map(f => `${glyphs.arrowRight} ${f}`).join('\n'));

  const symlinkLines = await Promise.all(
    symlinks.map(async name => {
      const target = await fs.readlink(path.join(agentPath, name));
      const color = name === 'latest' ? chalk.magenta : name === 'current' ? chalk.green : chalk.gray;
      const isCurrent = name === 'current';
      const glyph = isCurrent ? `${glyphs.check} ` : '  ';
      // Pad raw label to fixed width so arrow aligns regardless of glyph or color
      const labelText = name.padEnd(8);
      const label = color(labelText);
      return `${glyph}${label} → ${path.basename(target)}`;
    })
  );
  paddedSub('', symlinkLines.join('\n'));
  paddedLog(
    'To assign a version as the current agent',
    'dokugent agent --use <agent>@<birthstamp>',
    PAD_WIDTH,
    'blue',
    'HELP'
  );
  console.log();
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
