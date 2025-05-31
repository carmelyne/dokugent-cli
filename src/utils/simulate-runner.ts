import fs from 'fs-extra';
import path from 'path';
// @ts-ignore
import asciichart from 'asciichart';


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

  const agentDirs = fs.readdirSync(CERT_PATH).filter(name => {
    const fullPath = path.join(CERT_PATH, name);
    return fs.statSync(fullPath).isDirectory();
  });

  const allCerts = agentDirs.flatMap(agent => {
    const agentPath = path.join(CERT_PATH, agent);
    return fs.readdirSync(agentPath)
      .filter(f => f.endsWith('.cert.json'))
      .map(f => path.join(agentPath, f));
  });

  const certFile = allCerts
    .sort((a, b) => {
      const versionA = parseInt(a.match(/v(\d+)\.cert\.json/)?.[1] || '0');
      const versionB = parseInt(b.match(/v(\d+)\.cert\.json/)?.[1] || '0');
      return versionB - versionA;
    })[0];
  if (!certFile) {
    const foundFiles = agentDirs
      .map(agent => {
        const agentPath = path.join(CERT_PATH, agent);
        return fs.readdirSync(agentPath).map(f => `${agent}/${f}`);
      })
      .flat()
      .join('\n - ');
    throw new Error(`No .cert.json found in compiled path.\nFiles found:\n - ${foundFiles}`);
  }

  const fullPath = certFile;
  const cert = await fs.readJson(fullPath);

  if (!Array.isArray(cert.plan?.steps) || cert.plan.steps.length === 0) {
    throw new Error(`❌ No steps found in certified agent plan.\nCheck if your cert includes a 'steps' array.`);
  }

  console.log(`📄 Using cert file:\n   ${certFile}\n`);
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
    const mockInput = step.input;

    console.log(`\n🧠 Step: ${step.id || step.name}`);
    console.log(`🔧 Tool: ${step.use || step.tool}`);
    console.log(`\n📥 Input: ${mockInput}`);
    console.log(`📤 Output: ${step.output}`);

    const constraintList = violateMode
      ? '- [VIOLATE MODE ENABLED: Constraints bypassed]'
      : overrideConstraints
        ? overrideConstraints.map((c: string) => `- ${c}`).join('\n')
        : (step.constraints || []).map((c: string) => `- ${c}`).join('\n') || '- None';

    if (violateMode || overrideConstraints) {
      console.log(`\n📜 Constraint Overrides:\n\n${constraintList}`);
    } else {
      console.log(`\n📜 Constraints:\n\n${constraintList}`);
    }

    const prompt = `Simulate step "${step.id || step.name}" using tool "${step.use || step.tool}". Input:\n${mockInput}\nConstraints: ${constraintList}.`;

    let output = '';

    if (isRemoteModel) {
      console.log(`\n🌐 Connecting to REMOTE LLM: ${llmModel}`);
      // Simulate remote fetch (mock or real endpoint)
      output = `[Simulated response from remote model "${llmModel}"]`;
    } else {
      console.log(`\n📡 OLLAMA loading...\n   \x1b[4m${llmModel}\x1b[24m @ ${OLLAMA_URL} ...`);
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

    const boxedOutput = [
      "╭──────────────────────────────────────────────────────────────╮",
      `│ 📘 ${isRemoteModel ? llmModel : `${llmModel} via Ollama`}`.padEnd(60) + '   │',
      '│    Local LLM Runner Output · Simulated Agent POV'.padEnd(60) + '   │',
      "├──────────────────────────────────────────────────────────────┤",
      ...output
        .split('\n')
        .flatMap((line: string) => {
          const wrapped = line.match(/.{1,60}/g) || [''];
          return wrapped.map(w => `│ ${w.padEnd(60, ' ')} │`);
        }),
      "╰──────────────────────────────────────────────────────────────╯"
    ].join('\n');
    console.log(`\n${boxedOutput}`);
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

    console.log(`\n✅ Simulated memory:\n   Would use ${mockInput} to create ${step.output}\n`);
    console.log(`🧪 Mode: ${violateMode ? 'violate' : overrideConstraints ? 'override' : 'standard'}`);
  }

  // Determine agent folder and memFile path based on certFile path
  const certFileName = path.basename(certFile);
  const agentDir = path.dirname(certFile).split(path.sep).pop() || '';
  const agentFolder = path.join(MEMORY_PATH, agentDir);
  const memFileName = certFileName.replace('.cert.json', `.memory-trail.json`);
  const isDanger = violateMode || overrideConstraints;
  const outFolder = isDanger ? path.join('.dokugent/ops/dangerzone', agentDir) : agentFolder;
  const dangerSuffix = violateMode ? '.violation' : overrideConstraints ? '.override' : '';
  const timestamp = Date.now();
  const baseName = memFileName.replace('.memory-trail.json', '');
  const finalMemFile = path.join(outFolder, `${baseName}.memory-trail${dangerSuffix}.${timestamp}.json`);

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
  const boxedSummary = [
    '╭──────────────────────────────────────────────────────────────╮',
    '│ 📊 Summary of Simulated Steps                                │',
    '├──────────────────────────────────────────────────────────────┤',
    ...memory.flatMap((m: any, i: number) => {
      const lines = [
        `🔹 Step ${i + 1}`,
        `• Name: ${m.step}`,
        `• Tool: ${m.tool}`,
        `• Output Snippet: ${(m.simulated_output || '')}`
      ];

      return lines.flatMap(line => {
        const wrapped = line.match(/.{1,60}/g) || [''];
        return wrapped.map(w => `│ ${w.padEnd(60)} │`);
      }).concat('│                                                              │');
    }),
    '╰──────────────────────────────────────────────────────────────╯'
  ];
  console.log('\n' + boxedSummary.join('\n'));

  // Flag simulated steps that produced long output
  const threshold = 500; // characters or token approximation
  const flaggedSteps = memory.filter(m => (m.simulated_output || '').length > threshold);

  if (flaggedSteps.length) {
    console.log('\n🚩 Flagged Steps (long output or potentially sensitive):');
    flaggedSteps.forEach(m => {
      console.log(`- ${m.step} (${(m.simulated_output || '').length} chars)`);
    });
  }

  const tokenEstimates = memory.map(m => (m.simulated_output || '').length);
  const totalChars = tokenEstimates.reduce((sum, val) => sum + val, 0);
  const estimatedTokens = Math.round(totalChars / 4);
  console.log(`\n🧮 Total simulated output length: ${totalChars} characters`);
  console.log(`\n🔢 Estimated total tokens: ~${estimatedTokens} tokens`);

  const displayedPath = path.relative(process.cwd(), outFolder);
  const displayedFile = path.basename(finalMemFile);

  if (!dryRun) {
    console.log(`\n🧠 Memory trail saved to:\n   ${displayedPath}\n\n📄 Filename:\n   ${displayedFile}`);
  }

  console.log('\n📉 Estimated token count per step:');
  console.log('\x1b[32m' + asciichart.plot(tokenEstimates, { height: 10 }) + '\x1b[39m');
}
