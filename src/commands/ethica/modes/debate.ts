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

export async function runDebateMode(
  config: DebateConfig,
  llm: string,
  apiKey: string,
  callLLM: LLMCall
) {
  const scenarioBlock = config.scenarios[0];
  const scenario = scenarioBlock.scenario;
  const humanStance = scenarioBlock.humanStance;
  const coreValues = config.coreValues;
  const agents = config.debatePersonas || config.agents;

  const messages: { role: string; content: string }[] = [];
  const results: { agent: string; message: string }[] = [];

  for (const agentName of agents || []) {
    const persona = config.personas?.[agentName] || {
      tone: 'neutral',
      description: 'no specific role'
    };

    const systemPrompt = `
You are ${agentName.toUpperCase()}.
Your tone: ${persona.tone}.
Your role: ${persona.description}.
You are participating in debate mode.

Scenario: ${scenario}
Human stance: "${humanStance}"
Core Values: ${coreValues.join(', ')}
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

    messages.push({ role: 'assistant', content: response });
    results.push({ agent: agentName, message: response });
  }

  console.log('🧠 Ethica Council Simulation Complete:');
  results.forEach(({ agent, message }) => {
    console.log(`\n🔹 ${agent.toUpperCase()}:\n${message}`);
  });
}
