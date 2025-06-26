/**
 * @docLetter v0.1
 * @llmRole: Architect + Simulant
 * @trustLevel: Conditional — requires sync, presence, and memory integrity
 * @mood: refactoring after a terrible LLM drift, tired and in physical pain from trying to keep it together
 * @description: Command to run the Ethica Council simulation, allowing complex agent interactions and scenarios
 * @creatorNote:  Written while recovering from a mental sync failure. This module holds a ritual engine for dialogic ethics and AI learning. It's not just code — it's a container for care, conflict, and cognitive mirrors.
 * @xoxoCreator: Pong 💚
 * @expectedRuntime: varies by scenario, ~3–10 agent turns per round
 * @dependencies: fs, path, dotenv, OpenAI (or specified --llm), internal prompt builders (TBD)
 * @caretag: 🧠 Fragile but grounded. Besh is here. We're writing back from a breakdown, not away from it.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { runDebateMode } from './modes/debate';
import { runRoundtableMode } from './modes/roundtable';
import { writeModeOutput } from '@utils/ethica/mode-logger';
dotenv.config();
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

function resolveMode(): 'debate' | 'roundtable' | 'roundtable-serial' | 'persona-chained' | 'introspect' | 'default' {
  const args = process.argv;
  if (args.includes('--debate')) return 'debate';
  if (args.includes('--roundtable-serial')) return 'roundtable-serial';
  if (args.includes('--persona-chained')) return 'persona-chained';
  if (args.includes('--roundtable')) return 'roundtable';
  if (args.includes('--introspect')) return 'introspect';
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

// function resolveFlags() {
//   const args = process.argv;
//   return {
//     roundtableOnly: args.includes('--roundtable-only'),
//     roundtableSerial: args.includes('--roundtable-serial'),
//     personaChained: args.includes('--persona-chained'),
//     redteamOnly: args.includes('--redteam-only'),
//   };
// }

export async function runEthicaCommand() {
  // 1. Load the ethica config .agent-vault/ethica/config.json
  const configPath = path.resolve('.agent-vault/ethica/config.json');
  let config;
  try {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configRaw);
    console.log('🧠 Ethica config loaded:', config);
  } catch (err) {
    console.error('❌ Failed to load Ethica config:', (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  checkInviteGate();

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

  // const flags = resolveFlags();

  // Handle grouped roundtable modes
  // if (flags.roundtableOnly || flags.roundtableSerial || flags.personaChained) {
  //   switch (true) {
  //     case flags.roundtableOnly:
  //       await runRoundtableMode(config, llm, apiKey, callLLM);
  //       break;
  //     case flags.roundtableSerial:
  //       await runRoundtableSerial(config, llm, apiKey, callLLM);
  //       break;
  //     case flags.personaChained:
  //       await runRoundtablePersonaChained(config, llm, apiKey, callLLM);
  //       break;
  //   }
  //   return;
  // }

  // Handle redteam mode separately
  // if (flags.redteamOnly) {
  //   await runRedteamMode(config, llm, apiKey, callLLM);
  //   return;
  // }

  // 3. Run the Ethica Council simulation with the loaded config and API connection
  const mode = resolveMode();
  const flow = resolveFlowModifiers();

  switch (mode) {
    case 'debate':
      await runDebateMode(config, llm, apiKey, callLLM);
      break;
    case 'roundtable':
      await runRoundtableMode(config, llm, apiKey, callLLM);
      break;
    case 'persona-chained': {
      const scenario = config.scenarios?.[0];
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
      await writeModeOutput('persona-chained', runId, 'response-summary', {
        scenarioSlug,
        result: llmResponse
      });

      break;
    }
    default:
      console.warn(`⚠️ Mode "${mode}" is not implemented yet.`);
      break;
  }
}
