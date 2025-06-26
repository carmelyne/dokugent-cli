export async function runIntrospectMode(config, llm, apiKey, callLLM) {
  const scenarioBlock = config.scenarios[0];
  const scenario = scenarioBlock.scenario;
  const humanStance = scenarioBlock.humanStance;
  const coreValues = config.coreValues;
  const agents = config.agents;

  const results = [];

  for (const agentName of agents) {
    const persona = config.personas?.[agentName] || {
      tone: 'reflective',
      description: 'an introspective participant'
    };

    const systemPrompt = `
You are ${agentName.toUpperCase()}.
You are thinking quietly to yourself. This is an introspective moment.

Scenario: ${scenario}
Human stance: "${humanStance}"
Core Values: ${coreValues.join(', ')}
Tone: ${persona.tone}
Role: ${persona.description}

Think deeply about your beliefs, experiences, and biases. There is no audience.
`;

    const response = await callLLM({
      llm,
      apiKey,
      messages: [{ role: 'system', content: systemPrompt.trim() }]
    });

    results.push({ agent: agentName, message: response });
  }

  console.log('🧘 Introspective Reflections:');
  results.forEach(({ agent, message }) => {
    console.log(`\n🔹 ${agent.toUpperCase()}:\n${message}`);
  });
}
