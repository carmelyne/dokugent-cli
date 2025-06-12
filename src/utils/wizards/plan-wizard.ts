/**
 * @file plan-wizard.ts
 * @description Interactive CLI wizard for defining agent plan steps and capabilities.
 * Outputs a versioned `plan.md` file and updates the active symlink.
 */
import { prompt } from 'enquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';
import { estimateTokensFromText } from '../tokenizer';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';

/**
 * Launches the interactive wizard for creating an agent plan.
 *
 * Responsibilities:
 * - Prompts for step ID, agent metadata, goal, and constraints.
 * - Generates a versioned `plan.md` file describing the plan structure.
 * - Defines tool usage and links capabilities to step identifiers.
 * - Updates the symlink to the latest plan version.
 *
 * @returns {Promise<void>}
 */
export async function promptPlanWizard(): Promise<void> {
  const agentSymlink = path.resolve('.dokugent/data/agents/current');
  let agentId = 'unknown-agent';
  try {
    agentId = await fs.readlink(agentSymlink);
  } catch {
    console.error('❌ No active agent found. Run `dokugent agent use <name>` first.');
    return;
  }
  const baseFolder = path.resolve('.dokugent/data/plans', agentId);
  await fs.ensureDir(baseFolder);

  const stepFolder = path.join('.dokugent/data/plans', agentId, 'steps');
  await fs.ensureDir(stepFolder);
  const existingSteps = (await fs.readdir(stepFolder)).map(f => path.parse(f).name);

  const availableChoices = ['summarize_input', 'web_search', 'data_extraction', 'custom'].filter(
    step => !existingSteps.includes(step)
  );

  const { stepId } = await prompt<{ stepId: string }>([
    {
      type: 'select',
      name: 'stepId',
      message: 'Select a plan step ID:',
      choices: availableChoices
    }
  ]);

  let finalStepId = stepId;
  if (stepId === 'custom') {
    const { customStepId } = await prompt<{ customStepId: string }>([
      {
        type: 'input',
        name: 'customStepId',
        message: 'Enter custom step ID:',
        initial: 'my_step'
      }
    ]);
    if (existingSteps.includes(customStepId)) {
      console.warn(`⚠️ Step ID "${customStepId}" already exists. This will overwrite the current step.`);
    }
    finalStepId = customStepId;
  }

  // Enquirer does not support `filter` property, so we handle constraints post-prompt.
  const answersRaw = await prompt<{
    description: string,
    role: string,
    goal: string,
    constraints: string
  }>([
    {
      type: 'input',
      name: 'description',
      message: 'Plan overview (what is this step about?)',
      initial: `High-level description for ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'role',
      message: 'Agent Role (What is this agent responsible for?):',
      initial: `Agent for step ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'goal',
      message: 'Goal of this step:',
      initial: `Fulfill step ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'constraints',
      message: 'List constraints (comma-separated):',
      initial: 'Must use defined tools only, Output must pass human review',
    },
  ]);
  // Post-process constraints
  const answers = {
    ...answersRaw,
    constraints: typeof answersRaw.constraints === 'string'
      ? answersRaw.constraints.split(',').map((s: string) => s.trim())
      : [],
  };


  let stepUse = '';
  let stepInput = '';
  let stepOutput = '';
  switch (finalStepId) {
    case 'summarize_input':
      stepUse = 'summarize-tool';
      stepInput = 'mocks/summarize-tool/input.md';
      stepOutput = 'mocks/summarize-tool/draft-summary.md';
      break;
    case 'web_search':
      stepUse = 'web-search-tool';
      stepInput = 'mocks/web-search-tool/query.md';
      stepOutput = 'mocks/web-search-tool/web-search-results.md';
      break;
    case 'data_extraction':
      stepUse = 'data-extraction-tool';
      stepInput = 'mocks/data-extraction-tool/source.md';
      stepOutput = 'mocks/data-extraction-tool/parsed-data.md';
      break;
    default:
      stepUse = 'custom-tool';
      stepInput = `mocks/custom-tool/${finalStepId}-input.md`;
      stepOutput = `mocks/custom-tool/${finalStepId}-output.md`;
      break;
  }
  await fs.ensureFile(path.join('.dokugent/ops', stepInput));
  await fs.ensureFile(path.join('.dokugent/ops', stepOutput));

  // --- Randomized example content for mock files ---
  function randomPick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  const summarizeInputs = [
    '# Case: AI Regulation in Southeast Asia\n\nThis paper explores how different ASEAN countries are approaching AI governance, with a focus on data sovereignty, ethical alignment, and regulatory timing.',
    '# Analysis Request\n\nPlease analyze the document detailing the compliance risks associated with using generative AI in corporate environments. Highlight governance gaps and recommendations.',
    '# Overview: Agentic Tools in Healthcare\n\nThis article investigates how agent-based systems are entering diagnostic workflows and what oversight structures are being considered.'
  ];

  const summarizeOutputs = [
    'Several ASEAN nations are progressing independently in regulating AI. Key themes include prioritizing national data control, aligning AI with local ethics, and regulating before full-scale deployment.',
    'The document highlights risks such as data leakage, model drift, and shadow decision-making. Recommendations include AI usage audits, signed outputs, and stricter tool approval workflows.',
    'The article reveals that agentic systems in healthcare face scrutiny around liability and explainability. Oversight boards and mandatory review checkpoints are emerging governance patterns.'
  ];

  const searchQueries = [
    'Latest regulatory updates on foundation models (2024)',
    'Agent transparency proposals from OECD and UNESCO',
    'Risks of autonomous agents in financial systems'
  ];

  const searchResults = [
    '1. UNESCO recommends traceable decision logs for AI agents.\n2. U.S. draft legislation proposes licensing for foundation models.\n3. UK pilots agent registration database in fintech.',
    '1. OECD calls for watermarking generative outputs.\n2. Japan publishes voluntary AI agent charter.\n3. EU AI Act enters enforcement stage by Q1 2025.',
    '1. MAS flags algorithmic trading bots for behavior volatility.\n2. IMF suggests agent-level stress testing tools.\n3. Canada adds explainability to AI audit standards.'
  ];

  const extractionInputs = [
    'Org: GreenLeaf Coop\nCarbon Offset Credits: 150 tons\nVerified By: EcoLedger\nDate: 2024-03-18',
    'Entity: StratCore Analytics\nSpend: USD 47,800\nCategory: Cloud Services\nProcurement ID: CX-9422-B\nFiscal: Q2-2025',
    'Supplier: Solarwave Inc\nTotal Billed: PHP 382,000\nStatus: Unpaid\nDue Date: 2024-07-15'
  ];

  const extractionOutputs = [
    JSON.stringify({ organization: "GreenLeaf Coop", credits: "150 tons", verifier: "EcoLedger", date: "2024-03-18" }, null, 2),
    JSON.stringify({ entity: "StratCore Analytics", spend: "USD 47,800", category: "Cloud Services", procurement_id: "CX-9422-B", fiscal: "Q2-2025" }, null, 2),
    JSON.stringify({ supplier: "Solarwave Inc", total_billed: "PHP 382,000", status: "Unpaid", due_date: "2024-07-15" }, null, 2)
  ];

  // Write randomized mock content to input/output files
  const writeIfEmpty = async (relPath: string, content: string) => {
    const absPath = path.join('.dokugent/ops', relPath);
    const existing = await fs.readFile(absPath, 'utf-8').catch(() => '');
    if (!existing.trim()) {
      await fs.writeFile(absPath, content, 'utf-8');
    }
  };

  const mockInputContent: string = {
    'summarize-tool': randomPick(summarizeInputs),
    'web-search-tool': randomPick(searchQueries),
    'data-extraction-tool': randomPick(extractionInputs),
    'custom-tool': `This is a placeholder input file for the "${finalStepId}" step.`,
  }[stepUse]!;

  const mockOutputContent: string = {
    'summarize-tool': randomPick(summarizeOutputs),
    'web-search-tool': randomPick(searchResults),
    'data-extraction-tool': randomPick(extractionOutputs),
    'custom-tool': `This is a placeholder output file for the "${finalStepId}" step.`,
  }[stepUse]!;

  await writeIfEmpty(stepInput, mockInputContent);
  await writeIfEmpty(stepOutput, mockOutputContent);
  const steps = [
    {
      id: finalStepId,
      use: stepUse,
      input: stepInput,
      output: stepOutput
    }
  ];
  const toolSet = Array.from(new Set(steps.map(step => step.use)));

  // Update plan.index.md to reflect linkage
  const indexPath = path.join(baseFolder, 'plan.index.md');
  let indexLines: string[] = [];

  if (await fs.pathExists(indexPath)) {
    indexLines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
  }

  const alreadyListed = indexLines.some(line => line.trim().startsWith(`${finalStepId} -`));
  if (!alreadyListed) {
    indexLines.push(`${finalStepId} - linked`);
    await fs.writeFile(indexPath, indexLines.join('\n'), 'utf-8');
  }

  // Write plan.json as a twin of plan.md, with backup if exists, and merge with existing if present
  const now = new Date();
  const jsonPath = path.join(baseFolder, 'plan.json');
  const jsonData = {
    agentId,
    createdAt: now.toISOString(),
    createdAtDisplay: now.toLocaleString(),
    lastModifiedAt: now.toISOString(),
    lastModifiedAtDisplay: now.toLocaleString(),
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    estimatedTokens: 0, // placeholder, will be overwritten below
    steps: steps.map(step => ({
      id: step.id,
      use: step.use,
      input: step.input,
      output: step.output,
      description: answers.description,
      role: answers.role,
      goal: answers.goal,
      constraints: answers.constraints
    }))
  };

  if (await fs.pathExists(jsonPath)) {
    const backupPath = path.join(baseFolder, 'plan.bak.json');
    await fs.copyFile(jsonPath, backupPath);

    const existingJson = await fs.readJson(jsonPath);
    const existingSteps = existingJson.steps || [];

    // Merge with deduplication
    const mergedSteps = [...existingSteps, ...jsonData.steps].filter(
      (step, index, self) =>
        index === self.findIndex(s => s.id === step.id)
    );

    jsonData.steps = mergedSteps;
  }
  const tokenCount = estimateTokensFromText(JSON.stringify(jsonData, null, 2));
  jsonData.estimatedTokens = tokenCount;
  await fs.outputJson(jsonPath, jsonData, { spaces: 2 });

  // Write individual step file
  const stepDir = path.join(baseFolder, 'steps');
  await fs.ensureDir(stepDir);
  const stepFilePath = path.join(stepDir, `${finalStepId}.json`);
  await fs.writeJson(
    stepFilePath,
    jsonData.steps.find(step => step.id === finalStepId),
    { spaces: 2 }
  );

  console.log(`\n✅ plan.json updated inside:\n   .dokugent/data/plans/${agentId}/\n`);
  console.log(`🧮 Estimated agent plan step tokens: \x1b[32m~${tokenCount} tokens\x1b[0m\n`);
  console.log(`🧪 Mock input saved to: .dokugent/ops/${stepInput}`);
  console.log(`🧪 Mock output saved to: .dokugent/ops/${stepOutput}\n`);

  // Update latest symlink
  const symlinkPath = path.resolve('.dokugent/data/plans', 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
}
