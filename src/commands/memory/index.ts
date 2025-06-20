import fs from 'fs/promises';
import { addMemoryEntry, queryMemory, listMemory } from '../../utils/vector-db';

async function main() {
  const args = process.argv.slice(2);
  const getFlag = (flag: string) => {
    const index = args.findIndex(arg => arg === flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : null;
  };

  const hasFlag = (flag: string) => args.includes(flag);

  const collection = getFlag('--collection') || 'dokugent_memory';

  if (hasFlag('--test')) {
    console.log('🧪 Inserting test memory...');
    await addMemoryEntry('Vector DB Admin is a new AI infra role.', ['test', 'vector'], collection);
    const results = await queryMemory('AI roles', collection);
    console.log(`🔍 Found ${results.length} results:\n`);
    results.forEach((r: any, i: number) => console.log(`${i + 1}. ${r.payload.text}`));
    return;
  }

  if (hasFlag('--list')) {
    const entries = await listMemory(collection);
    console.log(`📚 Memory entries:\n`);
    entries.forEach((entry: any, i: number) => console.log(`${i + 1}. ${entry.payload?.text || '[no text]'}`));
    return;
  }

  const add = getFlag('--add');
  const query = getFlag('--query');
  const tagStr = getFlag('--tags');
  const tags = tagStr ? tagStr.split(',') : [];

  if (add) {
    let content = add;
    if (await fs.stat(add).catch(() => null)) {
      content = await fs.readFile(add, 'utf8');
    }
    await addMemoryEntry(content, tags, collection);
    console.log(`✅ Memory entry added.`);
    return;
  }

  if (query) {
    const results = await queryMemory(query, collection);
    console.log(`🔍 Query returned ${results.length} results:\n`);
    results.forEach((r: any, i: number) => console.log(`${i + 1}. ${r.payload.text}`));
    return;
  }

  console.log('⚠️ No valid flag provided. Use --add, --query, --list, or --test.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
