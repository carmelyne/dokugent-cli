import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';
import getActiveAgentInfo from '@utils/agent-info';
import { formatRelativePath } from '@utils/format-path';
import { estimateTokensFromText } from '@utils/tokenizer';

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

export async function runByoCommand() {
  console.log('\n🧪 Bring your own....\n');
  // 1. Assigned to an agentid@birthtimestamp / getActiveAgentInfo
  const agentInfo = await getActiveAgentInfo();
  if (!agentInfo) {
    console.warn('\n⚠️ No active agent found. Make sure to run `dokugent init` or select an agent.');
    return;
  }

  const { agentId, agentSlug } = agentInfo;

  // 2. Scan and validate .dokugent/data/byo/raw
  const rawDir = path.resolve('.dokugent/data/byo/raw');
  const files = await fs.readdir(rawDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.warn(`\n⚠️ No JSON files found in ${rawDir}`);
    return;
  }

  console.log('\n📂 Available raw BYO files:\n');
  jsonFiles.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
  });

  const choice = await prompt(`\nSelect a file [1-${jsonFiles.length}]: `);
  const index = parseInt(choice, 10) - 1;
  const selectedFile = jsonFiles[index];

  if (!selectedFile) {
    console.warn('\n❌ Invalid selection.\n');
    return;
  }

  const filePath = path.join(rawDir, selectedFile);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let byoItems;

  try {
    byoItems = JSON.parse(fileContent);
  } catch (err) {
    console.error('\n❌ Failed to parse JSON:', (err as any).message, '\n');
    return;
  }

  if (!Array.isArray(byoItems)) {
    console.warn('⚠️ BYO content should be a JSON array of objects.');
    return;
  }

  console.log(`\n_____\n\n📦 Loaded ${byoItems.length} BYO item(s) from "${selectedFile}"`);

  console.log(`\n🔗 Linked to agent: ${agentSlug}`);

  // 3. Save to processed path
  const outputDir = path.resolve(`.dokugent/data/byo/processed/${agentSlug}`);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'byo.json');
  let shouldWrite = true;
  try {
    await fs.access(outputPath);
    const confirm = await prompt(`\n⚠️ File already exists at... \n   ${formatRelativePath(outputPath)}.\n\n   Overwrite? (y/N):`);
    if (confirm.trim().toLowerCase() !== 'y') {
      console.log('\n🚫 Skipped saving file.\n');
      shouldWrite = false;
    }
  } catch {
    // File doesn't exist, proceed
  }

  if (shouldWrite) {
    await fs.writeFile(outputPath, JSON.stringify(byoItems, null, 2), 'utf-8');
    console.log(`\n💾 Saved to: ${formatRelativePath(outputPath)}`);
  }

  // 4. Estimate token count
  const tokenEstimate = estimateTokensFromText(JSON.stringify(byoItems));
  console.log(`\n🧠 Estimated token usage: ~${tokenEstimate} tokens\n`);
}
