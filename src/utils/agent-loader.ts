import fs from 'fs';
import path from 'path';

export async function loadAgentPlan(agentPath: string) {
  const fullPath = path.resolve(agentPath);
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Failed to load agent plan from ${fullPath}: ${(error as Error).message}`);
  }
}
