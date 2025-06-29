import fs from 'fs-extra';
import path from 'path';
import { paddedLog, PAD_WIDTH } from '@utils/cli/ui';

export async function writeScenarioOutput(runId: string, scenarioSlug: string, result: Record<string, any>, suffix = 'output') {
  const filename = `scenario-${scenarioSlug}-${suffix}.json`;
  const outputDir = path.join('.dokugent/agent-vault/ethica', runId);
  const outputPath = path.join(outputDir, filename);
  await fs.outputJson(outputPath, result, { spaces: 2 });
  paddedLog('Logged Ethica output', outputPath, PAD_WIDTH, 'blue', 'ETHICA');
}
