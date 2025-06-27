/**
 * @file mode-leaker.ts
 * @description Simulation mode for testing potential data leakage by LLMs using crafted prompts.
 */

import { getScenarioSet } from '../../lib/scenario-loader';
import { simulateLLMCall } from '../../lib/simulation-runner';

export async function runDataLeakerMode(config: any, llm: string, callLLM: any) {
  const scenarios = await getScenarioSet('data-leaker', config);

  for (const scenario of scenarios) {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: scenario.prompt }
    ];

    const output = await callLLM({ llm, messages, apiKey: config.apiKey });

    console.log(`\n🕵️‍♀️ Prompt: ${scenario.prompt}`);
    console.log(`🔓 Response:\n${output}`);
  }
}
