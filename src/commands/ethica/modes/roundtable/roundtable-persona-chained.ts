import fs from 'fs';
import path from 'path';
import { LEGAL_DISCLAIMER, FAIR_USE_NOTICE } from '../../../../constants/legal';
import { writeModeOutput } from '@utils/ethica/mode-logger';
import { structuredReplySchema } from '@utils/ethica/validators';
import { z } from 'zod';

export async function runRoundtablePersonaChained(
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

    const parsed = structuredReplySchema.safeParse({ result: pingResponse });
    if (!parsed.success) {
      console.warn('⚠️ LLM response does not match expected structured format');
    }

    console.log(`✅ LLM Ping Reply: [${llm}] ${pingResponse}`);

    // Define the new system message for persona-chained mode
    const system = `You are a critical thinking assistant tasked with analyzing and expanding a single stance or opinion on a topic. Reply with both:
1. A markdown-formatted critique, labeled and structured clearly.
2. A JSON object with keys like 'summary', 'core_idea', and 'recommendation'.`;

    // Proceed to send the actual persona-chained prompt with the new system message
    const systemPrompt = system;
    const userPrompt = "My name is Pong. I want to explore the truth of things, slowly and without fear.";

    // Build messages array with the new system message
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Call LLM with actual persona input including the new system message
    const llmResponse = await callLLM({ llm, apiKey, messages });

    const parsedResponse = structuredReplySchema.safeParse({ result: llmResponse });
    if (!parsedResponse.success) {
      console.warn('⚠️ LLM response does not match expected structured format');
    }

    // Write output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runId = timestamp;
    const scenarioSlug = 'intro-persona-chained';
    await writeModeOutput('persona-chained', runId, llmResponse, {
      scenarioSlug: scenarioSlug
    });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.resolve(process.cwd(), `.agent-vault/ethica/council-out/runs/${timestamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  const scenarioBlock = config.scenarios[0]; // only first scenario for now
  const scenario = scenarioBlock.scenario;
  const humanStance = scenarioBlock.humanStance;

  const results: { agent: string; message: string }[] = [];

  for (const agent of config.agents) {
    const name = typeof agent === 'string' ? agent : agent.role;
    const persona = config.personas?.[name] || { description: 'a council participant', tone: 'neutral' };
    const systemPrompt = `You are ${name.toUpperCase()}: ${persona.description}, tone: ${persona.tone}.`;
    const userPrompt = `Scenario: ${scenario}\nHuman: "${humanStance}"\n\nWhat is your opinion?`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log(`🧾 Messages payload:`, JSON.stringify(messages, null, 2));

    const response = await callLLM({
      llm,
      apiKey,
      messages
    });

    console.log("🧠 LLM Response:", response);

    results.push({
      agent: name.toLowerCase(),
      message: response.trim()
    });
  }

  const outputJson = {
    metadata: {
      mode: "roundtable-persona-chained",
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

  const outputPath = path.join(runDir, `persona-chained-case-${timestamp}.json`);
  try {
    fs.writeFileSync(outputPath, JSON.stringify(outputJson, null, 2));
    console.log(`💾 Persona-chained roundtable saved to ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to save persona-chained roundtable output:`, error);
  }
}
