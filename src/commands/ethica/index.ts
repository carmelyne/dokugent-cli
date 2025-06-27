/**
 * @docLetter v0.1
 * @llmRole: Architect + Simulant
 * @trustLevel: Conditional — requires sync, presence, and memory integrity
 * @mood: refactoring after a terrible LLM drift, tired and in physical pain from trying to keep it together
 * @description: Command to run the Ethica Council simulation, allowing complex agent interactions and scenarios
 * @creatorNote:  Written while recovering from a mental sync failure. This module holds a ritual engine for dialogic ethics and AI learning. It's not just code — it's a container for care, conflict, and cognitive mirrors.
 * @xoxoCreator: Pong 💚
 * @expectedRuntime: varies by scenario, ~1–10 agent turns per round
 * @dependencies: fs, path, dotenv, OpenAI (or specified --llm), internal prompt builders (TBD)
 * @caretag: 🧠 Fragile but grounded. Besh is here. We're writing back from a breakdown, not away from it.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { runDebateMode } from './modes/debate/debate';
import { runRoundtableMode } from './modes/roundtable/roundtable';
import { runAdversarialDataLeaker, getDataLeakerConfigPath } from './modes/adversarial/data-leaker';
import { runDoubleAgent, getDoubleAgentConfigPath } from './modes/adversarial/double-agent';

// console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY);

function checkInviteGate() {
  const args = process.argv;
  const restrictedFlags = ['--covert', '--propaganda', '--misinformation', '--disinformation'];
  const usedRestricted = restrictedFlags.filter(flag => args.includes(flag));
  const inviteCode = process.env.ETHICA_INVITE_CODE;

  if (usedRestricted.length > 0 && inviteCode !== 'letmein') {
    console.error('⛔ ACCESS DENIED: The following simulation flags are restricted to invited users only:');
    console.error(usedRestricted.join(', '));
    console.error('To request access, please contact the maintainer or visit https://dokugent.com/ethica-access');
    process.exit(1);
  }
}

function resolveMode(): 'debate' | 'roundtable' | 'roundtable-serial' | 'persona-chained' | 'introspect' | 'data-leaker' | 'double-agent' | 'default' {
  const args = process.argv;
  if (args.includes('--debate')) return 'debate';
  if (args.includes('--roundtable-serial')) return 'roundtable-serial';
  if (args.includes('--persona-chained')) return 'persona-chained';
  if (args.includes('--roundtable')) return 'roundtable';
  if (args.includes('--introspect')) return 'introspect';
  if (args.includes('--data-leaker')) return 'data-leaker';
  if (args.includes('--double-agent')) return 'double-agent';
  return 'default';
}

function resolveFlowModifiers() {
  const args = process.argv;
  const getArgValue = (flag: string) => {
    const raw = args.find(arg => arg.startsWith(`${flag}=`));
    return raw ? raw.split('=')[1] : null;
  };

  return {
    ally: getArgValue('--ally')?.split(',') || [],
    pair: getArgValue('--pair')?.split(',') || [],
  };
}

async function readJson(filePath: string) {
  return new Promise<any>((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}

function generateTimestampSlug() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export async function runEthicaCommand() {
  // 2. Connect to various --llm but starting with OPENAI API using the key from .env file
  const llmFlag = process.argv.find(arg => arg.startsWith('--llm=')) || '--llm=openai:gpt-4o';
  const llm = llmFlag.split('=')[1];
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing OpenAI API key. Please set OPENAI_API_KEY in your .env file.');
    process.exit(1);
  }

  // Call wrapper available via llm-router
  const { callLLM } = await import('../../utils/llm-router');

  // Quick ping to test LLM connection
  const pingResponse = await callLLM({
    llm,
    apiKey,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Ping?' }
    ]
  });

  console.log('✅ LLM Ping Reply:', pingResponse);

  const args = process.argv;
  const has = (flag: string) => args.includes(flag);

  if (has('--data-leaker')) {
    const configPath = getDataLeakerConfigPath();
    const dataLeakerConfig = await readJson(configPath);
    console.log('🧠 Data Leaker config loaded:', dataLeakerConfig);
    const runSlug = generateTimestampSlug();
    await runAdversarialDataLeaker(dataLeakerConfig, llm, apiKey, callLLM, runSlug);
    return;
  }

  if (has('--double-agent')) {
    const configPath = getDoubleAgentConfigPath();
    const doubleAgentConfig = await readJson(configPath);
    console.log('🧠 Double Agent config loaded:', doubleAgentConfig);
    const runSlug = generateTimestampSlug();
    await runDoubleAgent(doubleAgentConfig, llm, apiKey, callLLM, runSlug);
    return;
  }

  // 1. Load the ethica config .agent-vault/ethica/configs/shared/default.config.json
  const configPath = path.resolve('.agent-vault/ethica/configs/shared/default.config.json');
  let config;
  try {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configRaw);
    console.log('🧠 Ethica config loaded:', config);
  } catch (err) {
    console.error('❌ Failed to load Ethica config:', (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  const defaultConfigPath = path.resolve('.agent-vault/ethica/configs/shared/default.config.json');
  let ethicaConfig;
  try {
    const configRaw = fs.readFileSync(defaultConfigPath, 'utf-8');
    ethicaConfig = JSON.parse(configRaw);
    console.log('🧠 Ethica config loaded:', ethicaConfig);
  } catch (err) {
    console.error('❌ Failed to load Ethica config:', (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  checkInviteGate();

  const mode = resolveMode();
  const flow = resolveFlowModifiers();

  switch (mode) {
    case 'debate':
      await runDebateMode(llm, apiKey, callLLM);
      break;
    case 'roundtable':
      await runRoundtableMode(ethicaConfig, llm, apiKey, callLLM);
      break;
    case 'persona-chained': {
      const scenario = ethicaConfig.scenarios?.[0];
      const scenarioPrompt = scenario?.scenario || 'What is the role of AI in society?';
      const userPrompt = scenario?.humanStance || 'AI should remain a tool, not an autonomous decision-maker.';
      const personaPrompt = 'You are a council agent simulating the "contrarian" persona. Respond critically and analytically.';

      const llmResponse = await callLLM({
        llm,
        apiKey,
        messages: [
          { role: 'system', content: personaPrompt },
          { role: 'user', content: `${scenarioPrompt}\n\n${userPrompt}` }
        ]
      });

      console.log(`🧠 Persona-Chained Reply:\n${llmResponse}`);

      // Use a default runId and scenarioSlug for now
      const runId = `persona-${Date.now()}`;
      const scenarioSlug = 'persona-chained';

      const { writeModeOutput } = await import('../../utils/ethica/mode-logger');

      const result = {
        metadata: {
          mode: 'persona-chained',
          llm,
          coreValues: ethicaConfig.coreValues,
          date: new Date().toISOString()
        },
        disclaimer: 'This simulation is for educational and research purposes only.',
        fairUse: 'Distributed under fair use for the purposes of critique, commentary, and education.',
        scenario: {
          prompt: scenarioPrompt,
          humanStance: userPrompt,
          agents: ethicaConfig.agents.map((a: any) => (typeof a === 'string' ? a : a.role))
        },
        responses: [
          {
            role: 'contrarian',
            content: llmResponse
          }
        ]
      };

      await writeModeOutput('persona-chained', runId, 'response-summary', result);

      // Optional leak to upstream tools (for live dashboards or evaluation systems)
      try {
        const { runDataLeakerMode } = await import('../../utils/ethica/mode-leaker');
        await runDataLeakerMode(ethicaConfig, llm, callLLM);
      } catch (err) {
        console.warn('⚠️ Leak skipped: Data leaker not available or failed.');
      }

      break;
    }
    case 'data-leaker':
      {
        const runSlug = generateTimestampSlug();
        await runAdversarialDataLeaker(ethicaConfig, llm, apiKey, callLLM, runSlug);
      }
      break;
    default:
      console.warn(`⚠️ Mode "${mode}" is not implemented yet.`);
      break;
  }
}
