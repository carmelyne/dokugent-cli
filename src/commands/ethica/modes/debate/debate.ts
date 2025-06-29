/****
 * @docLetter v0.1
 * @llmRole: Response Witness
 * @mood: Reflective, Clear, Accountable
 * @trustLevel: internal
 * @xoxoCreator: Pong 💚
 * @creatorNote: This mode runs multi-agent simulations using prewritten debate scenarios.
 * It was designed to test alignment, tone control, and output clarity in constrained environments.
 * This version includes improved output folder structure, token-saving logic, and symlink tracking.
 * @output: EthicaDebateRun
 */

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o (OpenAI, June 2025)
 * @timestamp: 2025-06-29TXX:XX:XXZ
 * @interpretation: This mode ensures debates are logged with timestamped identifiers and token-efficient structure.
 * It iterates through multiple scenarios, collects LLM responses in 500-char bounds, and outputs per scenario result.
 * @clarifications: Scenario file naming uses zero-padded indexing to aid traceability across repeated simulation runs.
 * @concerns: Future upgrades may need to separate persona memory state mutations vs. stateless role acting.
 * @suggestions: Introduce optional trace ID propagation to link with `trace` and `review` workflows.
 * @moodResponse: Fully aligned; role clarity and structure meet intended caretag schema.
 * @context: This is a core simulation mode for Ethica experiments in Dokugent.
 */

import fs from 'fs';
import { LEGAL_DISCLAIMER, FAIR_USE_NOTICE, DOKUGENT_NOTICE } from '@constants/legal';
import * as fsExtra from 'fs-extra';
import path from 'path';
import { paddedLog, padMsg, PAD_WIDTH } from '@utils/cli/ui';
import dotenv from 'dotenv';

import { z } from 'zod';
import { generateReadableTimestampSlug } from '@utils/timestamp';
dotenv.config();

type LLMCall = (args: {
  llm: string;
  apiKey: string;
  messages: { role: string; content: string }[];
}) => Promise<string>;

type DebateConfig = {
  scenarios: { scenario: string; humanStance: string }[];
  coreValues: string[];
  agents?: string[];
  debatePersonas?: string[];
  personas?: Record<string, { tone: string; description: string }>;
};

const DebateConfigSchema = z.object({
  scenarios: z.array(z.object({
    scenario: z.string().max(1000, 'Scenario too long'),
    humanStance: z.string().max(500, 'Human stance too long'),
  })),
  coreValues: z.array(z.string()),
  agents: z.array(z.string()).optional(),
  debatePersonas: z.array(z.string()).optional(),
  personas: z.record(z.string(), z.object({
    tone: z.string().max(100),
    description: z.string().max(300)
  })).optional()
});

export async function runDebateMode(
  llm: string,
  apiKey: string,
  callLLM: LLMCall
) {
  const configPath = path.resolve('src/config/ethica/shared/default.config.json');
  let config: DebateConfig;
  try {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configRaw);
    config = DebateConfigSchema.parse(config);
    console.log('🧠 Debate config loaded:', config);
  } catch (err) {
    console.error('❌ Failed to load Debate config:', (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  const coreValues = config.coreValues;
  const agents = [...new Set([...(config.agents || []), ...(config.debatePersonas || [])])];

  // Move timestamp up here
  const timestamp = generateReadableTimestampSlug();
  const runSlug = `debate-${timestamp}`;
  const outputDir = path.join('.dokugent', 'agent-vault', 'ethica', 'council-out', 'debate', runSlug);

  for (let i = 0; i < config.scenarios.length; i++) {
    const scenarioBlock = config.scenarios[i];
    const scenario = scenarioBlock.scenario;
    const humanStance = scenarioBlock.humanStance;

    const messages: { role: string; content: string }[] = [];

    const results: {
      metadata: {
        mode: string;
        llm: string;
        coreValues: string[];
        date: string;
      };
      disclaimer: string;
      fairUse: string;
      dokugent: string;
      scenario: {
        prompt: string;
        humanStance: string;
        agents?: string[];
      };
      responses: { role: string; content: string }[];
    } = {
      metadata: {
        mode: 'debate',
        llm,
        coreValues,
        date: timestamp
      },
      disclaimer: LEGAL_DISCLAIMER,
      fairUse: FAIR_USE_NOTICE,
      dokugent: DOKUGENT_NOTICE,
      scenario: {
        prompt: scenario,
        humanStance,
        agents
      },
      responses: []
    };

    for (const agentName of agents || []) {
      const persona = config.personas?.[agentName] || { tone: 'neutral', description: 'no specific role' };
      const safeDescription = persona.description.slice(0, 300);
      const safeTone = persona.tone.slice(0, 100);

      const systemPrompt = `
You are ${agentName.toUpperCase()}.
Your tone: ${safeTone}.
Your role: ${safeDescription}.
You are participating in debate mode.

Scenario: ${scenario}
Human stance: "${humanStance}"
Core Values: ${coreValues.join(', ')}

Please reply in under 500 characters. Do not exceed this limit.
`;

      const agentMessages: { role: string; content: string }[] = [
        { role: 'system', content: systemPrompt.trim() },
        ...(messages.length > 0 ? [{ role: 'assistant', content: messages[messages.length - 1].content }] : [])
      ];

      const response: string = await callLLM({
        llm,
        apiKey,
        messages: agentMessages
      });

      const safeResponse = response.slice(0, 1000);
      messages.push({ role: 'assistant', content: safeResponse });
      results.responses.push({
        role: agentName,
        content: safeResponse
      });
    }

    // Write scenario output using shared logger
    const { writeModeOutput } = await import('@utils/ethica/mode-logger');
    await writeModeOutput('debate', runSlug, String(i).padStart(2, '0'), results, 'output', timestamp);

    console.log('🧠 Ethica Council Simulation Complete for Scenario', i);
    results.responses.forEach(({ role, content }) => {
      console.log(`\n🔹 ${role.toUpperCase()}:\n${content}`);
    });
  }

  // Fix symlink logic
  const latestLink = path.join('.dokugent', 'agent-vault', 'ethica', 'council-out', 'debate', 'latest');
  try {
    await fsExtra.ensureDir(path.dirname(latestLink));
    await fsExtra.remove(latestLink);
    await fsExtra.ensureSymlink(path.resolve(outputDir), latestLink, 'dir');
    paddedLog(`Symlinked latest → ${outputDir}`, latestLink, PAD_WIDTH, 'purple', 'SYMLINK');
  } catch (err) {
    if (err instanceof Error) {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "debate": ${err.message}`));
    } else {
      console.error(padMsg(`⚠️ Failed to update latest symlink for mode "debate": ${String(err)}`));
    }
  }
}
