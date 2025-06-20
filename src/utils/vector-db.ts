const QDRANT_URL = 'http://localhost:6333';
import fetch from 'node-fetch';
import { createHash, randomUUID } from 'crypto';

export const EMBEDDING_CONFIG = {
  model: 'nomic-embed-text',
  vectorDim: 768
};

// Utility: real embed function using external API
async function embedText(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text
    })
  });

  const data = (await response.json()) as { embedding?: number[] };

  if (!Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding format returned from embedding API');
  }

  console.log('🧬 Embedded Text:', text);
  console.log('📏 Vector length:', data.embedding.length);
  return data.embedding;
}

export async function ensureCollection(collection: string): Promise<void> {
  const res = await fetch(`${QDRANT_URL}/collections/${collection}`);
  if (res.status === 200) return;

  await fetch(`${QDRANT_URL}/collections/${collection}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: {
        size: EMBEDDING_CONFIG.vectorDim,
        distance: 'Cosine'
      }
    })
  });
}

export async function addMemoryEntry(text: string, tags: string[] = [], collection: string) {
  await ensureCollection(collection);
  const vector = await embedText(text);
  const id = randomUUID();

  const res = await fetch(`${QDRANT_URL}/collections/${collection}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [
        {
          id,
          vector,
          payload: {
            text,
            tags,
            timestamp: new Date().toISOString()
          }
        }
      ]
    })
  });
  if (!res.ok) {
    const error = await res.text();
    console.error(`❌ Failed to insert memory into ${collection}:`, error);
  } else {
    console.log(`✅ Vector inserted into ${collection}`);
  }
}

export async function queryMemory(query: string, collection: string) {
  await ensureCollection(collection);
  const vector = await embedText(query);

  const res = await fetch(`${QDRANT_URL}/collections/${collection}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vector,
      limit: 5,
      with_payload: true
    })
  });

  const data = (await res.json()) as { result: any[] };
  console.log('🧪 Query Vector:', vector);
  console.log('📦 Qdrant Response:', JSON.stringify(data, null, 2));
  return data.result || [];
}

export async function listMemory(collection: string) {
  await ensureCollection(collection);
  const res = await fetch(`${QDRANT_URL}/collections/${collection}/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 20,
      with_payload: true
    })
  });

  const data = (await res.json()) as { result: any[] };
  return data.result || [];
}
