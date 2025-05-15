

import fs from 'fs-extra';
import path from 'path';

export async function loadBlacklist(): Promise<string[]> {
  const baseDir = path.join(__dirname);
  const mainList = await loadLines(path.join(baseDir, 'blacklist.txt'));

  const overridePath = path.join(process.cwd(), '.dokugent/overrides/blacklist.txt');
  const overrideList = (await fs.pathExists(overridePath))
    ? await loadLines(overridePath)
    : [];

  return [...mainList, ...overrideList];
}

export async function loadWhitelist(): Promise<string[]> {
  const whitelistPath = path.join(process.cwd(), '.dokugent/overrides/whitelist.txt');
  return (await fs.pathExists(whitelistPath))
    ? await loadLines(whitelistPath)
    : [];
}

async function loadLines(filepath: string): Promise<string[]> {
  const raw = await fs.readFile(filepath, 'utf8');
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}