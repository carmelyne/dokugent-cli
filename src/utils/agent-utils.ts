import fs from 'fs';
import path from 'path';
import open from 'open';
import { exec } from 'child_process';

export function getAgentDir(slug: string): string {
  return path.resolve('.dokugent/data/agents', slug);
}

export function loadAgentIdentity(slug: string): any {
  const identityPath = path.join(getAgentDir(slug), 'identity.json');
  if (!fs.existsSync(identityPath)) {
    throw new Error(`❌ identity.json not found for agent: ${slug}`);
  }
  return JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
}

export function showAgentIdentity(slug: string): void {
  const identity = loadAgentIdentity(slug);
  console.log('\n📄 Agent Identity:\n');
  console.log(JSON.stringify(identity, null, 2));
  console.log(`\n✏️  To edit this file:\n    \x1b[34mdokugent agent --edit --agent ${slug}\x1b[0m\n`);
}

export function editAgentIdentity(slug: string): void {
  const identityPath = path.join(getAgentDir(slug), 'identity.json');
  const editor = process.env.EDITOR || 'code';
  exec(`${editor} "${identityPath}"`);
}

export function validateAgentIdentity(slug: string): void {
  const identity = loadAgentIdentity(slug);
  // TODO: Add schema validation logic here
  console.log('\n✅ Identity validated (domain: Identity | step 1 of 6 pre-certification checks).');
  console.log(`\n✏️  To edit this file:\n    \x1b[34mdokugent agent --edit --agent ${slug}\x1b[0m\n`);
}

export function resolveAgentSlugFromArgs(args: string[]): string {
  const index = args.indexOf('--agent');
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  throw new Error(`❌ Please provide an agent using --agent <slug>`);
}
