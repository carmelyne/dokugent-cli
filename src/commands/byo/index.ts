import path from 'path';
import fs from 'fs/promises';
import { prompt as enquirerPrompt } from 'enquirer';
import getActiveAgentInfo from '@utils/agent-info';
import { formatRelativePath } from '@utils/format-path';
import { estimateTokensFromText } from '@utils/tokenizer';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';

async function prompt(query: string): Promise<string> {
  try {
    const { value } = await enquirerPrompt<{ value: string }>({
      type: 'input',
      name: 'value',
      message: padQuestion(query.trim()),
    });
    return value;
  } catch (err) {
    paddedLog('Bye...', 'Loading your BYO  JSON cancelled or failed', PAD_WIDTH, 'warn', 'EXITED');

      process.exit(0);
  }
}

export async function runByoCommand() {
  paddedLog('dokugent byo initialized...', '', PAD_WIDTH, 'info', 'Info');
  console.log(padMsg(`Bring your own json files...`));
  // console.log('\n🧪 Bring your own....\n');
  // 1. Assigned to an agentid@birthtimestamp / getActiveAgentInfo
  const agentInfo = await getActiveAgentInfo();
  if (!agentInfo) {
    paddedCompact('Uh oh...', 'No active agent found. Make sure to run `dokugent init` or select an agent.', PAD_WIDTH, 'warn');
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
  paddedLog('Available raw BYO files', '', PAD_WIDTH, 'magenta', 'BYO');
  jsonFiles.forEach((file, i) => {
    console.log(padMsg(`${i + 1}. ${file}`));
    console.log();
  });

  const promptText = padQuestion(`Select a file [1-${jsonFiles.length}]: `) + '\n' + padMsg('> ›');
  const choice = await prompt(promptText);
  const index = parseInt(choice, 12) - 1;
  const selectedFile = jsonFiles[index];

  if (!selectedFile) {
    // console.warn('\n❌ Invalid selection.\n');
    paddedLog('Invalid selection.', '', PAD_WIDTH, 'orange', 'Warn');
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
    paddedLog('BYO content should be a JSON array of objects.', '', PAD_WIDTH, 'orange', 'Warn');
    // console.warn('⚠️ BYO content should be a JSON array of objects.');
    return;
  }

  paddedLog(`${byoItems.length} BYO item(s) from "${selectedFile}"`, '', PAD_WIDTH, 'success', 'LOADED');
  paddedLog('Linked to agent', agentSlug, PAD_WIDTH, 'magenta', 'AGENT');

  // 3. Save to processed path
  const outputDir = path.resolve(`.dokugent/data/byo/processed/${agentSlug}`);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'byo.json');
  let shouldWrite = true;
  try {
    await fs.access(outputPath);
    paddedLog('File already exists at...', formatRelativePath(outputPath) + '\n', PAD_WIDTH, 'orange', 'WARN');
    const confirm = await prompt(padQuestion('Overwrite? (y/N):'));
    if (confirm.trim().toLowerCase() !== 'y') {
      paddedLog('Skipped saving file.', '', PAD_WIDTH, 'orange', 'WARN');
      shouldWrite = false;
    }
  } catch {
    // File doesn't exist, proceed
  }

  if (shouldWrite) {
    const metadataWrapped = {
      agentId,
      createdAt: new Date().toISOString(),
      createdAtDisplay: new Date().toLocaleString(),
      cliVersion: DOKUGENT_CLI_VERSION,
      schemaVersion: DOKUGENT_SCHEMA_VERSION,
      createdVia: DOKUGENT_CREATED_VIA,
      byo: byoItems
    };
    await fs.writeFile(outputPath, JSON.stringify(metadataWrapped, null, 2), 'utf-8');
    paddedLog('Saved to:', `${formatRelativePath(outputPath)}`, PAD_WIDTH, 'success', 'SAVED');
  }

  // 4. Estimate token count
  const tokenEstimate = estimateTokensFromText(JSON.stringify(byoItems));
  paddedLog('Estimated token usage:', ` ~${tokenEstimate}`, PAD_WIDTH, 'pink', 'TOKENS');
  paddedLog('To see a preview of your ai agent, run:', `dokugent preview`, PAD_WIDTH, 'blue', 'HELP');
  console.log();
}
