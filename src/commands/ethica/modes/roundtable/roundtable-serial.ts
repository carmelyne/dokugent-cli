import fs from 'fs';
import path from 'path';
import { LEGAL_DISCLAIMER, FAIR_USE_NOTICE } from '../../../../constants/legal';
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
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.resolve(process.cwd(), `.agent-vault/ethica/council-out/runs/${timestamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  const scenarioBlock = config.scenarios[0]; // handle first scenario only for now
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

  console.log(`\n🗣️ Serial Roundtable Responses:\n${priorDialogue}`);

  const outputJson = {
    metadata: {
      mode: "roundtable-serial",
      llm,
      coreValues: config.coreValues,
      date: timestamp
    },
    disclaimer: LEGAL_DISCLAIMER,
    fairUse: FAIR_USE_NOTICE,
    scenario: {
      prompt: scenario,
      humanStance,
      agents: config.agents
    },
    responses: results
  };

  const outputPath = path.join(runDir, `serial-case-1.json`);
  fs.writeFileSync(outputPath, JSON.stringify(outputJson, null, 2));
  console.log(`💾 Serial mode output saved to ${outputPath}`);
}
