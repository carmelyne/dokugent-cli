import { generateReadableTimestampSlug } from '@utils/timestamp';
import path from 'path';
import fs from 'fs-extra';
import { paddedLog, padMsg, PAD_WIDTH } from '@utils/cli/ui';

/**
 * Writes the mode output to a JSON file and updates the 'latest' symlink.
 *
 * The `result` parameter should be a standardized object with the following structure:
 * {
 *   metadata: {
 *     date: string,
 *     llm: string
 *   },
 *   scenario: {
 *     prompt: string,
 *     humanStance: string
 *   },
 *   disclaimer: string,
 *   fairUse: string
 * }
 *
 * This structure is especially important for 'persona-chained' mode to ensure consistency.
 *
 * @param mode - The mode of operation ('roundtable' | 'redteam' | 'persona-chained' | 'debate')
 * @param runId - The unique run identifier
 * @param scenarioSlug - The scenario slug
 * @param result - The result object containing standardized fields as described above
 * @param suffix - Optional suffix for the output file name (default 'output')
 * @param runSlug - Required run slug to share the same timestamp folder across scenario outputs
 */
export async function writeModeOutput(
  mode: 'roundtable' | 'roundtable-serial' | 'redteam' | 'persona-chained' | 'debate',
  runId: string,
  scenarioSlug: string,
  result: Record<string, any>,
  suffix = 'output',
  runSlug?: string
) {
  const timestamp = runSlug || generateReadableTimestampSlug();

  if (!result.metadata?.date) {
    result.metadata = result.metadata || {};
    result.metadata.date = timestamp;
  }

  if (mode === 'persona-chained' && !result.metadata) {
    result = {
      metadata: {
        mode,
        llm: result.llm || result.metadata?.llm || 'unknown',
        coreValues: result.coreValues || result.metadata?.coreValues || [],
        date: timestamp
      },
      disclaimer:
        result.disclaimer ||
        result.metadata?.disclaimer ||
        'For educational use only. This output does not constitute professional or legal advice.',
      fairUse:
        result.fairUse ||
        result.metadata?.fairUse ||
        'This material is distributed without profit for research and educational purposes.',
      scenario: {
        prompt: result.prompt || result.scenario?.prompt || '',
        humanStance: result.humanStance || result.scenario?.humanStance || '',
        agents: result.agents || result.scenario?.agents || []
      },
      responses: [
        {
          role: result.role || result.responses?.[0]?.role || 'unknown',
          content: result.result || result.responses?.[0]?.content || ''
        }
      ]
    };
  }

  // Save the json output to a file in the appropriate mode directory
  const scenario = scenarioSlug || 'default';
  const outputDir = path.join('.dokugent/agent-vault/ethica/council-out', mode, runId);
  const filename = `${mode}-${scenarioSlug}-${suffix}-${timestamp}.json`;
  const outputPath = path.join(outputDir, filename);

  await fs.outputJson(outputPath, result, { spaces: 2 });
  paddedLog(`Logged ${mode} output`, outputPath, PAD_WIDTH, 'blue', 'JSON');

  // Create or update 'latest' symlink per mode and scenario
  const outputDirBase = path.join('.dokugent/agent-vault/ethica/council-out', mode);
  const latestLink = path.join(outputDirBase, 'latest');
  try {
    await fs.ensureDir(path.dirname(latestLink));
    await fs.remove(latestLink);

    const latestSymlink = path.join(outputDirBase, 'latest');
    try {
      await fs.promises.unlink(latestSymlink);
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'code' in err && (err as any).code !== 'ENOENT') {
        throw err;
      }
    }

    await fs.promises.symlink(path.resolve(outputDir), latestLink, 'dir');
    paddedLog(`Symlinked latest → ${outputDir}`, latestLink, PAD_WIDTH, 'purple', 'SYMLINK');
  } catch (err) {
    if (err instanceof Error) {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "${mode}": ${err.message}`));
    } else {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "${mode}": ${String(err)}`));
    }
  }
}

/**
 * Writes a single scenario output to a consistent path using the same structure as writeModeOutput.
 *
 * @param mode - The mode of operation
 * @param scenarioSlug - The scenario slug
 * @param output - The output object to write
 */
export async function writeScenarioOutput({
  mode,
  scenarioSlug,
  output,
  runSlug,
}: {
  mode: string;
  scenarioSlug: string;
  output: unknown;
  runSlug?: string;
}) {
  const timestamp = runSlug || generateReadableTimestampSlug();
  const filename = `${scenarioSlug}-output-${timestamp}.json`;
  const outputDir = path.join('.dokugent/agent-vault/ethica/council-out', mode, `${mode}-${timestamp}`);

  await fs.ensureDir(outputDir);
  const fullPath = path.join(outputDir, filename);
  await fs.writeJson(fullPath, output, { spaces: 2 });

  // Symlink the latest directory to the full run directory (like writeModeOutput)
  const runDir = outputDir;
  const latestDirLink = path.join('.dokugent/agent-vault/ethica/council-out', mode, 'latest');

  try {
    await fs.ensureDir(path.dirname(latestDirLink));
    if (fs.existsSync(latestDirLink)) {
      await fs.remove(latestDirLink);
    }
    await fs.symlink(path.resolve(runDir), latestDirLink, 'dir');
  } catch (e) {
    console.warn('⚠️ Failed to update latest symlink:', e);
  }
}
