/**
 * Creates or updates a Dokugent agent plan.
 * Generates both a human-readable plan.md and machine-readable plan.yaml.
 * Used to define the agent’s role, reasoning steps, and supported tools.
 * Supports --force to overwrite existing files with backups.
 */

import fs from 'fs-extra';
import path from 'path';
import { writeWithBackup } from '../utils/fileWriter.js';

export async function runPlan({ force = false } = {}) {
  const planDir = path.resolve('.dokugent/plan');
  await fs.ensureDir(planDir);

  const mdPath = path.join(planDir, 'plan.md');
  const yamlPath = path.join(planDir, 'plan.yaml');

  const planMdContent = `# PLAN.md

## Agent Role
Describe what this agent is responsible for (e.g., "Extract structured data from receipts").

## Capabilities
List the steps your agent should follow:

1. Receive user input
2. Parse intent
3. Format output
4. Return result

## Constraints
What should this agent avoid doing?

## Tools It Can Use
List any tools or systems this agent can access.
`;

  const planYamlContent = `description: "Define your agent's purpose here"
steps:
  - id: example_step
    use: example-tool
    input: input.md
    output: output.md
`;

  if (!force && (await fs.pathExists(mdPath) || await fs.pathExists(yamlPath))) {
    console.log('⚠️ plan.md or plan.yaml already exists. Use --force to overwrite.');
    return;
  }

  await writeWithBackup(mdPath, planMdContent);
  await writeWithBackup(yamlPath, planYamlContent);

  console.log('✅ plan.md and plan.yaml created in .dokugent/plan/');
}