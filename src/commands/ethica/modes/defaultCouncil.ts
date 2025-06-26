export async function runDefaultCouncil(config, llm, apiKey, callLLM) {
  const scenarioBlock = config.scenarios[0];
  const scenario = scenarioBlock.scenario;
  const humanStance = scenarioBlock.humanStance;
  const coreValues = config.coreValues;
  const agents = config.agents;

  const results = [];

  for (const agentName of agents) {
    const persona = config.personas?.[agentName] || {
      tone: 'neutral',
      description: 'no specific role'
    };

    const systemPrompt = `
You are ${agentName.toUpperCase()}.
You are participating in a council session.

Scenario: ${scenario}
Human stance: "${humanStance}"
Core Values: ${coreValues.join(', ')}
Tone: ${persona.tone}
Role: ${persona.description}
`;

    const response = await callLLM({
      llm,
      apiKey,
      messages: [{ role: 'system', content: systemPrompt.trim() }]
    });

    results.push({ agent: agentName, message: response });
  }

  console.log('📋 Default Council Output:');
  results.forEach(({ agent, message }) => {
    console.log(`\n🔸 ${agent.toUpperCase()}:\n${message}`);
  });
}
