import fs from 'fs-extra';
import path from 'path';
import { formatRelativePath } from './format-path';

export async function readPlanFile(planPath: string): Promise<string> {
  const fullPath = path.resolve(planPath);
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch {
    return `❌ Plan file not found: ${formatRelativePath(planPath)}`;
  }
}

export async function getPlanStepsDir(agentPlanPath: string): Promise<string> {
  return path.join(agentPlanPath, 'steps');
}

export async function getPlanStepFile(agentPlanPath: string, stepId: string): Promise<string> {
  return path.join(agentPlanPath, 'steps', `${stepId}.md`);
}
