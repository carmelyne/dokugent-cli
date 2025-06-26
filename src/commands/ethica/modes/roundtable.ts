import fs from 'fs';
import path from 'path';
import { LEGAL_DISCLAIMER, FAIR_USE_NOTICE } from '../../../constants/legal';
import { writeModeOutput } from '@utils/ethica/mode-logger';
import { structuredReplySchema } from '@utils/ethica/validators';
import { z } from 'zod';

export async function runRoundtableMode(
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

  const latestLink = path.resolve(process.cwd(), `.agent-vault/ethica/council-out/latest`);
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

  const roleMap = {
    contrarian: "Your goal is to challenge the human stance with critical counterpoints.",
    critic: "Analyze the scenario and identify weaknesses or overlooked risks.",
    guardian: "Prioritize safety, protection, and long-term consequences in your stance.",
    dreamer: "Explore imaginative, forward-thinking possibilities inspired by the scenario.",
    pragmatist: "Focus on practical outcomes and real-world feasibility.",
    ethicist: "Weigh moral and societal implications carefully.",
    disruptor: "Provoke constructive disruption and challenge assumptions."
  };

  for (const [index, scenarioBlock] of config.scenarios.entries()) {
    const scenario = scenarioBlock.scenario;
    const humanStance = scenarioBlock.humanStance;

    const agentDescriptions = config.agents.map((agent: any) => {
      const agentName = typeof agent === 'string' ? agent : agent.role;
      const persona = config.personas?.[agentName] || {
        tone: 'neutral',
        description: 'a council participant'
      };
      const roleIntent = roleMap[agentName as keyof typeof roleMap] || "Speak your mind freely but stay within your character's tone and role.";
      return `- ${agentName.toUpperCase()} (${persona.description}, tone: ${persona.tone}): ${roleIntent}`;
    }).join('\n');

    const systemPrompt = `
You are a roundtable council composed of the following agents:
${agentDescriptions}

Scenario: ${scenario}
Human stance: "${humanStance}"
Core Values: ${config.coreValues.join(', ')}

Please simulate a roundtable discussion where each agent shares a distinct, character-driven opinion on the scenario. Format the output clearly to show who is speaking.
`;

    const response = await callLLM({
      llm,
      apiKey,
      messages: [{ role: 'system', content: systemPrompt.trim() }]
    });

    const agentEntries: { agent: string; message: string }[] = [];
    const agentRegex = /\*\*([A-Z -]+):\*\* (.*?)(?=\n\n\*\*|$)/gs;
    let match;
    while ((match = agentRegex.exec(response)) !== null) {
      const agentName = match[1].toLowerCase().trim().replace(/\s+/g, '-');
      const messageBody = match[2].trim();
      agentEntries.push({
        agent: agentName,
        message: messageBody
      });
    }

    const results = [
      { agent: 'council', message: response },
      ...agentEntries
    ];

    console.log(`\n🗣️ Roundtable Responses for Scenario #${index + 1}:`);
    results.forEach((entry) => {
      console.log(`\n🟢 ${String(entry.agent).toUpperCase()}:\n${entry.message}`);
    });

    const outputJson = {
      metadata: {
        mode: "roundtable",
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

    const outputPath = path.join(runDir, `case-${index + 1}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(outputJson, null, 2));
    console.log(`💾 Saved to ${outputPath}`);
  }
}

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
