import fs from 'fs';
import path from 'path';
import { LEGAL_DISCLAIMER, FAIR_USE_NOTICE, DOKUGENT_NOTICE } from '@constants/legal';
import { generateReadableTimestampSlug } from '@utils/timestamp';
import { writeModeOutput } from '@utils/ethica/mode-logger';
import { structuredReplySchema } from '@utils/ethica/validators';
import { z } from 'zod';

export async function runRoundtableSerial(
  config: any,
  llm: string,
  apiKey: string,
  callLLM: (input: { llm: string; apiKey: string; messages: { role: string; content: string }[] }) => Promise<string>
) {
  // Ollama ping logic before any conversation
  if (llm.startsWith("ollama:")) {
    console.log(`📡 Pinging local Ollama model: ${llm}`);
    const pingResponse = await callLLM({
      llm,
      apiKey,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Ping?" }
      ]
    });

    if (!pingResponse || pingResponse.trim().length < 5) {
      console.warn(`⚠️ Ollama model ${llm} did not respond to ping.`);
      throw new Error(`Ollama model ${llm} not responsive.`);
    }

    console.log(`✅ LLM Ping Reply: [${llm}] ${pingResponse}`);
  }

  const timestamp = generateReadableTimestampSlug();
  const runSlug = `roundtable-serial-${timestamp}`;
  const runDir = path.resolve(process.cwd(), `.dokugent/agent-vault/ethica/council-out/roundtable-serial/${runSlug}`);

  const latestLink = path.resolve(process.cwd(), `.dokugent/agent-vault/ethica/council-out/roundtable-serial/latest`);
  try {
    if (fs.existsSync(latestLink)) {
      if (fs.lstatSync(latestLink).isSymbolicLink() || fs.existsSync(latestLink)) {
        fs.unlinkSync(latestLink);
      }
    }
    fs.symlinkSync(runDir, latestLink, 'dir');
  } catch (err) {
    console.error('⚠️ Failed to update latest symlink:', err);
  }

  fs.mkdirSync(runDir, { recursive: true });

  for (let i = 0; i < config.scenarios.length; i++) {
    const scenarioBlock = config.scenarios[i];
    const scenario = scenarioBlock.scenario;
    const humanStance = scenarioBlock.humanStance;

    let priorDialogue = `Scenario: ${scenario}\nHuman: "${humanStance}"`;
    const results: { agent: string; message: string }[] = [];

    for (const agent of config.agents) {
      const name = typeof agent === 'string' ? agent : agent.role;
      const persona = config.personas?.[name] || { description: 'a council participant', tone: 'neutral' };
      const prompt = `${priorDialogue}\n\nWhat would ${name.toUpperCase()} say?\nRespond in the format:\n${name.toUpperCase()}: ...`;

      const response = await callLLM({
        llm,
        apiKey,
        messages: [{ role: 'system', content: prompt }]
      });

      const replyMatch = new RegExp(`${name.toUpperCase()}:\\s*(.+)`, 'i').exec(response);
      const cleanReply = replyMatch?.[1]?.trim() || '[No reply]';

      priorDialogue += `\n${name.toUpperCase()}: ${cleanReply}`;
      results.push({ agent: name.toLowerCase(), message: cleanReply });
    }

    console.log(`\n🗣️ Serial Roundtable Responses [${i}]:\n${priorDialogue}`);

    const outputJson = {
      metadata: {
        mode: "roundtable-serial",
        llm,
        coreValues: config.coreValues,
        date: timestamp
      },
      disclaimer: LEGAL_DISCLAIMER,
      fairUse: FAIR_USE_NOTICE,
      dokugent: DOKUGENT_NOTICE,
      scenario: {
        prompt: scenario,
        humanStance,
        agents: config.agents
      },
      responses: results
    };

    await writeModeOutput(
      'roundtable-serial',
      runSlug,
      i.toString().padStart(2, '0'),
      outputJson,
      'output',
      timestamp
    );
  }
}
