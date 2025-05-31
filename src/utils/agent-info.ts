import fs from 'fs-extra';
import path from 'path';

// Utility to get the active agent's information
// a.k.a. agentname and birthstamp
export default async function getActiveAgentInfo() {
  const basePath = '.dokugent/data/agents';
  const candidates = ['current', 'latest'];

  let resolved: string | null = null;

  for (const name of candidates) {
    const symlinkPath = path.join(basePath, name);
    if (await fs.pathExists(symlinkPath)) {
      resolved = await fs.realpath(symlinkPath);
      break;
    }
  }

  if (!resolved) {
    throw new Error('No current or latest agent symlink found.');
  }

  const slug = path.basename(resolved); // e.g. happybot@2025-05-30_14-12-22-492
  const [agentId] = slug.split('@');

  return {
    agentId,
    agentSlug: slug,
    versionPath: resolved
  };
}
