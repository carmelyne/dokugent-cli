import fs from 'fs';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';

export async function runEthicaViaMCP(input: {
  human: string;
  llm: string;
  agent: string;
}) {
  const timestamp = new Date().toISOString();
  const estimatedTokens = estimateTokensFromText(input.human);

  const mcpInput = {
    type: 'mcp-log',
    sender: 'user:cli',
    receiver: `agent:${input.agent}`,
    model: input.llm,
    timestamp,
    intent: 'simulate-ethica',
    estimatedTokens,
    input: {
      prompt: input.human
    }
  };

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.llm.replace('openai:', ''),
      messages: [
        { role: 'system', content: 'You are Ethica, a simulation agent focused on ethical deliberation.' },
        { role: 'user', content: input.human }
      ],
      temperature: 0.7
    })
  });

  const json = await openaiResponse.json();

  const mcpOutput = {
    ...mcpInput,
    response: {
      content: json.choices?.[0]?.message?.content || '',
      status: json.choices ? 'complete' : 'error',
      finish_reason: json.choices?.[0]?.finish_reason || null,
      raw: json
    }
  };

  const logDir = path.resolve('mcp_logs');
  const logPath = path.join(logDir, `mcp-ethica-${timestamp}.json`);

  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(mcpOutput, null, 2));

  console.log(`📄 MCP log saved to: ${logPath}`);
  return mcpOutput;
}
