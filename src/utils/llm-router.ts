let llmCallCounter = 0;

export async function callLLM({
  llm,
  messages,
  apiKey
}: {
  llm: string;
  messages: any[];
  apiKey: string;
}): Promise<string> {
  console.log(`🔁 LLM Call #${++llmCallCounter} → ${llm}`);
  console.log(`📡 LLM Call → Model: ${llm}`);
  console.log(`📨 Message count: ${messages.length}`);
  console.log(`🧮 Estimated token size: ~${JSON.stringify(messages).length / 4}`);

  if (llm.startsWith('openai:')) {
    const normalized = {
      'openai:gpt-4': 'gpt-4o-mini',
      'openai:gpt-4o': 'gpt-4o-mini',
      'openai:gpt-4-turbo': 'gpt-4o-mini'
    };
    const model = (normalized as Record<string, string>)[llm] || llm.split(':')[1] || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429 || errorText.includes('insufficient_quota')) {
        console.warn('⚠️ OpenAI quota exceeded. Falling back to meta:llama3.');
        return callLLM({ llm: 'meta:llama3', messages, apiKey: '' });
      }
      throw new Error(`❌ OpenAI API error: ${response.status} — ${errorText}`);
    }

    try {
      const data = await response.json();
      return `[${llm}] ` + (data.choices[0]?.message?.content || '');
    } catch (e) {
      const raw = await response.text();
      console.error('❌ Failed to parse JSON. Raw response:', raw);
      throw new Error(`❌ JSON parse error: ${e}`);
    }
  }

  if (llm.startsWith('meta:llama3')) {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`❌ Meta LLaMA error: ${response.status} — ${error}`);
    }

    try {
      const data = await response.json();
      return `[${llm}] ` + (data.message?.content || data.choices?.[0]?.message?.content || '');
    } catch (e) {
      const raw = await response.text();
      console.error('❌ Failed to parse JSON. Raw response:', raw);
      throw new Error(`❌ JSON parse error: ${e}`);
    }
  }

  if (llm.startsWith('ollama:')) {
    const model = llm.split(':')[1];
    const prompt = messages.map(m => m.content).join('\n\n');

    console.log('🧾 Messages payload for Ollama:', JSON.stringify(messages, null, 2));
    console.log('📤 Prompt:', prompt);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`❌ Ollama LLM error: ${response.status} — ${error}`);
    }

    try {
      const data = await response.json();
      const reply = data.response?.trim();
      if (!reply) {
        console.warn(`⚠️ Ollama returned empty content for ${llm}.`);
        return `[${llm}] ⚠️ [Empty reply from model]`;
      }
      return `[${llm}] ${reply}`;
    } catch (e) {
      const raw = await response.text();
      console.error('❌ Failed to parse JSON. Raw response:', raw);
      throw new Error(`❌ JSON parse error: ${e}`);
    }
  }

  throw new Error(`❌ Unsupported LLM: ${llm}`);
}
