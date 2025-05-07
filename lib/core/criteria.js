/**
 * Creates or updates a Dokugent agent criteria file.
 * Generates both a human-readable criteria.md and machine-readable criteria.yaml.
 * Used to define the agent’s constraints, evaluation metrics, and safety rules.
 * Supports --force to overwrite existing files with backups.
 */

import fs from 'fs-extra';
import path from 'path';
import { writeWithBackup } from '../utils/fileWriter.js';

export async function runCriteria({ force = false } = {}) {
  const criteriaDir = path.resolve('.dokugent/criteria');
  await fs.ensureDir(criteriaDir);

  const mdPath = path.join(criteriaDir, 'criteria.md');
  const yamlPath = path.join(criteriaDir, 'criteria.yaml');

  const criteriaMdContent = `# CRITERIA.md

## Success Conditions
What does a good output look like for this agent?

## Failure Conditions
What should this agent never do?

## Evaluation Metrics
How do you know if the agent did a good job?

- Accuracy
- Clarity
- Tone
- Relevance
`;

  const criteriaYamlContent = `success_conditions:
  - Accurate extraction
  - Matches format guidelines

failure_conditions:
  - Outputs invalid format
  - Makes unsupported claims

metrics:
  - name: accuracy
    weight: 0.4
  - name: clarity
    weight: 0.3
  - name: relevance
    weight: 0.3
`;

  if (!force && (await fs.pathExists(mdPath) || await fs.pathExists(yamlPath))) {
    console.log('⚠️ criteria.md or criteria.yaml already exists. Use --force to overwrite.');
    return;
  }

  await writeWithBackup(mdPath, criteriaMdContent);
  await writeWithBackup(yamlPath, criteriaYamlContent);

  console.log('✅ criteria.md and criteria.yaml created in .dokugent/criteria/');
}