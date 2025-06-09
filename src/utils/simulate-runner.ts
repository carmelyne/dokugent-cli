import fs from 'fs-extra';
import path from 'path';
import { AGENT_DIR } from '../constants/paths';
// @ts-ignore
import asciichart from 'asciichart';
import { runTraceAgent } from '@domain/trace/runner';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedLongText, paddedDefault, padQuestion } from '@utils/cli/ui';
import chalk from 'chalk';

const CERT_PATH = '.dokugent/ops/compiled/';
const MEMORY_PATH = '.dokugent/ops/simulated/';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

export async function runSimulateViaMistral() {
  const violateMode = process.argv.includes('--violate');
  const changeIdx = process.argv.indexOf('--change-constraints');
  const overrideConstraints = (changeIdx !== -1 && process.argv[changeIdx + 1])
    ? process.argv[changeIdx + 1].split(';').map(c => c.trim())
    : null;
  const dryRun = process.argv.includes('--dry');

  const remoteIdx = process.argv.indexOf('--remote');
  const remoteArg = remoteIdx !== -1;
  const dokuUriArg = remoteArg ? process.argv[remoteIdx + 1] : null;

  // Determine cert file using agent symlink (same logic as dryrun)
  const currentAgentPath = path.join(AGENT_DIR, 'current', 'identity.json');
  let currentAgentId = '';
  try {
    const identity = await fs.readJson(currentAgentPath);
    currentAgentId = `${identity.agentName}@${identity.birth}`;
  } catch {
    throw new Error('❌ Failed to load current agent identity. Make sure the symlink exists.');
  }

  let certFile = '';
  let cert;
  if (remoteArg && dokuUriArg) {
    console.log(`🌐 Fetching remote cert from MCP via ${dokuUriArg}`);
    paddedLog('MCP URL', `🌐 Fetching remote cert from MCP via ${dokuUriArg}`, PAD_WIDTH, 'blue', 'REMOTE');
    const dokuUri = `doku://${dokuUriArg}`;
    const result = await runTraceAgent({ dokuUri, token: process.env.SUPABASE_SERVICE_ROLE_KEY });
    cert = result.result || result;
    certFile = `[REMOTE] ${dokuUriArg}`;
  } else {
    const compiledAgentPath = path.join(CERT_PATH, currentAgentId);
    if (!fs.existsSync(compiledAgentPath)) {
      throw new Error(`❌ Compiled path not found for agent ${currentAgentId}`);
    }
    const files = fs.readdirSync(compiledAgentPath)
      .filter(f => /\.compiled\.v\d+\.cert\.json$/.test(f))
      .sort((a, b) => {
        const getVersion = (name: string) => {
          const match = name.match(/\.v(\d+)\.cert\.json$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getVersion(b) - getVersion(a);
      });
    if (files.length === 0) {
      throw new Error(`❌ No compiled certs found for agent ${currentAgentId}`);
    }
    certFile = path.join(compiledAgentPath, files[0]);
    cert = await fs.readJson(certFile);
  }

  if (!Array.isArray(cert.plan?.steps) || cert.plan.steps.length === 0) {
    throw new Error(`❌ No steps found in certified agent plan.\nCheck if your cert includes a 'steps' array.`);
  }

  const certPath = path.dirname(certFile);
  const certFileNameLocal = path.basename(certFile);
  const certSource = certFile.startsWith('[REMOTE]') ? '🌐 Remote MCP Cert' : 'Local Cert';
  paddedLog(`Fetching ${certSource}: ${certPath}`, `File: ${certFileNameLocal}`, PAD_WIDTH, 'blue', 'LOCAL');
  // console.log(`📄 ${certSource}:\n   ${certFile}\n`);
  if (violateMode) {
    console.log("⚠️  Simulation run with constraint enforcement disabled (--violate)");
  }
  if (overrideConstraints) {
    console.log("\n⚠️  Simulation run with altered constraints (--change-constraints)\n");
  }
  const memory = [];

  // Determine LLM model from CLI args or fallback to 'mistral'
  // TODO: Support remote LLMs via --llm=openai:gpt-4 or --llm=anthropic:claude-3
  // This will require adding API key config, headers, and a transport layer
  const llmArg = process.argv.find(arg => arg.startsWith('--llm='));
  const llmModel = llmArg ? llmArg.split('=')[1] : 'mistral';
  const isRemoteModel = llmModel.startsWith('openai:') || llmModel.startsWith('anthropic:');

  for (const step of cert.plan?.steps || []) {
    let mockInput = step.input;

    const mockPath = path.join('.dokugent/ops/mocks', mockInput);
    if (await fs.pathExists(mockPath)) {
      try {
        mockInput = await fs.readFile(mockPath, 'utf-8');
      } catch {
        console.warn(`⚠️  Failed to read mock input file: ${mockPath}`);
      }
    }

    console.log();
    paddedDefault('', `${step.id || step.name}`, PAD_WIDTH, 'pink', 'STEP');
    paddedDefault('', `${step.use || step.tool}`, PAD_WIDTH, 'pink', 'TOOL');
    console.log();

    // paddedDefault('', `${mockInput}`, PAD_WIDTH, 'success', 'INPUT');
    paddedDefault('', `${step.output}`, PAD_WIDTH, 'success', 'OUTPUT');
    console.log();

    const constraintList = violateMode
      ? '- [VIOLATE MODE ENABLED: Constraints bypassed]'
      : overrideConstraints
        ? overrideConstraints.map((c: string) => padMsg(`- ${c}`)).join('\n')
        : (step.constraints || []).map((c: string) => padMsg(`- ${c}`)).join('\n') || '- None';

    if (violateMode || overrideConstraints) {
      paddedDefault('Constraint Overrides', `\n${constraintList}`, PAD_WIDTH, 'warn', 'CONSTRAINT');
      // console.log(`\n📜 Constraint Overrides: \n\n${ constraintList }`);
    } else {
      paddedDefault('Constraint Overrides', `\n${constraintList}`, PAD_WIDTH, 'warn', 'CONSTRAINT');
      // console.log(`\n📜 Constraints: \n\n${ constraintList }`);
    }

    const prompt = `Simulate step "${step.id || step.name}" using tool "${step.use || step.tool}".Input: \n${mockInput}\nConstraints: ${constraintList}.`;

    let output = '';

    if (isRemoteModel) {
      // console.log(`\n🌐 Connecting to REMOTE LLM: ${llmModel}`);
      paddedDefault('Connecting to REMOTE LLM', `${llmModel}`, PAD_WIDTH, 'magenta', 'OLLAMA');
      // Simulate remote fetch (mock or real endpoint)
      output = `[Simulated response from remote model "${llmModel}"]`;
    } else {
      console.log();
      paddedDefault('Loading', `${chalk.magenta(llmModel)}@${OLLAMA_URL}...`, PAD_WIDTH, 'magenta', 'OLLAMA');
      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: llmModel,
          prompt,
          stream: false
        })
      });
      const data = await res.json();
      output = data.response || '[No response]';
    }

    console.log();
    const wrappedInput = mockInput
      .split('\n')
      .flatMap((line: string) => line.match(/.{1,62}/g) || [''])
      .join('\n');

    ui.box(`ℹ Use Input  \n\n${wrappedInput}`, 'blue', 'left', 'round', PAD_WIDTH);
    // paddedLongText('ℹ Input', '   ' + mockInput, 0, 'magenta');

    const wrappedOutput = output
      .split('\n')
      .flatMap((line: string) => {
        const wrappedLines = line.match(/.{1,60}/g) || [''];
        return wrappedLines.map((w: string) => w.padEnd(60));
      });

    const boxedOutput = ui.box(
      [
        `📘 ${isRemoteModel ? llmModel : `${llmModel} via Ollama`}`.padEnd(60),
        `\nLocal LLM Runner Output · Simulated Agent POV`.padEnd(60),
        '──────────────────────────────────────────────────────────────',
        ...wrappedOutput,
      ].join('\n'),
      'magenta',
      'left',
      'round',
      PAD_WIDTH
    );
    // console.log(`\n${boxedOutput}`);
    memory.push({
      step: step.id || step.name || '[unnamed]',
      tool: step.use || step.tool || '[unspecified]',
      simulated_input: mockInput,
      simulated_output: output,
      created_output: step.output,
      violated_constraints: violateMode
        ? (step.constraints || [])
        : overrideConstraints
          ? overrideConstraints
          : [],
      mode: violateMode ? 'violate' : overrideConstraints ? 'override' : 'standard',
    });

    console.log();
    const wrappedUsedOutput = mockInput
      .split('\n')
      .flatMap((line: string) => line.match(/.{1,62}/g) || [''])
      .join('\n');

    ui.box(`ℹ Simulated memory would use..\n\n${wrappedUsedOutput}\n\nto create ${step.output}\n`, 'blue', 'left', 'round', PAD_WIDTH);
    console.log();
    paddedDefault('', `Mode: ${violateMode ? 'violate' : overrideConstraints ? 'override' : 'standard'}`, PAD_WIDTH, 'magenta', 'MODE');
    console.log();
  }

  // Determine agent folder and memFile path based on certFile path
  const certFileName = path.basename(certFile);
  const agentDir = path.dirname(certFile).split(path.sep).pop() || '';
  const agentFolder = path.join(MEMORY_PATH, agentDir);
  const memFileName = certFileName.replace('.cert.json', `.memory - trail.json`);
  const isDanger = violateMode || overrideConstraints;
  const outFolder = isDanger ? path.join('.dokugent/ops/dangerzone', agentDir) : agentFolder;
  const dangerSuffix = violateMode ? '.violation' : overrideConstraints ? '.override' : '';
  const timestamp = Date.now();
  const baseName = memFileName.replace('.memory-trail.json', '');
  const finalMemFile = path.join(outFolder, `${baseName}.memory - trail${dangerSuffix}.${timestamp}.json`);

  if (!dryRun) {
    await fs.ensureDir(outFolder);
    await fs.writeJson(finalMemFile, memory, { spaces: 2 });

    if (isDanger) {
      const indexFile = path.join(outFolder, 'violation-index.json');
      let index = [];
      if (fs.existsSync(indexFile)) {
        index = await fs.readJson(indexFile);
      }
      index.push({
        file: path.basename(finalMemFile),
        violated_constraints: violateMode
          ? (cert.plan?.steps?.flatMap((s: any) => s.constraints || []) || [])
          : overrideConstraints || [],
        timestamp: new Date().toISOString()
      });
      await fs.writeJson(indexFile, index, { spaces: 2 });
    }
  }
  if (dryRun) {
    console.log('\n🧪 Dry run active: Memory trail was not written to disk.');
  }

  // Boxed summary
  const summaryLines = memory.flatMap((m: any, i: number) => {
    const lines = [
      `→ Step ${i + 1}`,
      `• Name: ${m.step}`,
      `• Tool: ${m.tool}`,
      `• Output Snippet: ${m.simulated_output || ''}`
    ];
    return lines.flatMap(line => {
      const wrapped = line.match(/.{1,62}/g) || [''];
      return wrapped.map(w => w.padEnd(62));
    }).concat('');
  });

  ui.box(
    ['ℹ Summary of Simulated Steps', '', ...summaryLines].join('\n'),
    'cyan',
    'left',
    'round',
    PAD_WIDTH
  );

  // Flag simulated steps that produced long output
  const threshold = 500; // characters or token approximation
  const flaggedSteps = memory.filter(m => (m.simulated_output || '').length > threshold);

  if (flaggedSteps.length) {
    const flaggedSummaryList = flaggedSteps.map(m => {
      const step = m.step || '[Unnamed Step]';
      const length = (m.simulated_output || '').length;
      return `- ${step} (${length} chars)`;
    });

    const flaggedSummary = flaggedSummaryList.join('\n');

    paddedLog(
      'Flagged Steps (long output or potentially sensitive)',
      flaggedSummary,
      PAD_WIDTH,
      'info',
      'STEPS'
    );

    // console.log('\n🚩 Flagged Steps (long output or potentially sensitive):');
    // console.log(flaggedSummaryList.join('\n'));
  }

  const tokenEstimates = memory.map(m => (m.simulated_output || '').length);
  const totalChars = tokenEstimates.reduce((sum, val) => sum + val, 0);
  const estimatedTokens = Math.round(totalChars / 4);
  console.log();
  paddedDefault('Total simulated output length', `${totalChars} characters`, PAD_WIDTH, 'magenta', 'CHARS');
  paddedDefault('Estimated total tokens', `~${estimatedTokens} tokens`, PAD_WIDTH, 'magenta', 'TOKENS');
  console.log();

  const displayedPath = path.relative(process.cwd(), outFolder);
  const displayedFile = path.basename(finalMemFile);

  if (!dryRun) {
    paddedLog(`Memory trail saved to: ${displayedPath}`, `File: ${displayedFile}`, PAD_WIDTH, 'blue', 'TRAIL');
  }

  // const chart = asciichart.plot(tokenEstimates, { height: 10, colors: [asciichart.green] });
  // ui.box(
  //   `📉 Estimated token count per step:\n\n${chart}`,
  //   'green',
  //   'left',
  //   'round',
  //   PAD_WIDTH
  // );
  console.log()
  paddedDefault(`Raw token estimates`, `${tokenEstimates}`, PAD_WIDTH, 'pink', 'TOKENS');
  // console.log('🧪 Raw token estimates:', tokenEstimates);
}
