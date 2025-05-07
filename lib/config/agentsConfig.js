import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AGENTS_YML_PATH = path.resolve(__dirname, 'agents.yaml');

export async function getAgentProfiles() {
  try {
    const content = await fs.readFile(AGENTS_YML_PATH, 'utf8');
    const data = yaml.load(content);
    return data?.agents || {};
  } catch (err) {
    console.error('⚠️ Failed to load agents.yml:', err.message);
    return {};
  }
}