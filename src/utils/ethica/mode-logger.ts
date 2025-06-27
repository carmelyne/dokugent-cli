export function generateTimestampSlug(): string {
  const iso = new Date().toISOString();
  return iso.replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
}
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
 * @param mode - The mode of operation ('roundtable' | 'redteam' | 'persona-chained')
 * @param runId - The unique run identifier
 * @param scenarioSlug - The scenario slug
 * @param result - The result object containing standardized fields as described above
 * @param suffix - Optional suffix for the output file name (default 'output')
 * @param runSlug - Required run slug to share the same timestamp folder across scenario outputs
 */
export async function writeModeOutput(
  mode: 'roundtable' | 'redteam' | 'persona-chained',
  runId: string,
  scenarioSlug: string,
  result: Record<string, any>,
  suffix = 'output',
  runSlug?: string
) {
  const timestamp = runSlug || generateTimestampSlug();

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
  const filenamePrefix = mode === 'roundtable' ? 'scenario' : mode;
  const outputDir = path.join('.agent-vault/ethica/council-out', mode, runId, scenarioSlug);
  const filename = `${filenamePrefix}-${scenarioSlug}-${suffix}-${timestamp}.json`;
  const outputPath = path.join(outputDir, filename);

  await fs.outputJson(outputPath, result, { spaces: 2 });
  paddedLog(`Logged ${mode} output`, outputPath, PAD_WIDTH, 'blue', 'JSON');

  // Create or update 'latest' symlink per mode and scenario
  const latestLink = path.join('.agent-vault/ethica/council-out', mode, 'latest', scenarioSlug);
  try {
    await fs.ensureDir(path.dirname(latestLink));
    await fs.remove(latestLink);
    await fs.ensureSymlink(path.resolve(outputDir), latestLink, 'dir');
    paddedLog(`Symlinked latest → ${outputDir}`, latestLink, PAD_WIDTH, 'purple', 'SYMLINK');
  } catch (err) {
    if (err instanceof Error) {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "${mode}": ${err.message}`));
    } else {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "${mode}": ${String(err)}`));
    }
  }
}
