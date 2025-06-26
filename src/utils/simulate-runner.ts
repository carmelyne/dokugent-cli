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
  if (process.argv.includes('--ethica')) {
    return;
  }
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
  const llmArg = process.argv.find(arg => arg.startsWith('--llm='));
  const llmModel = llmArg ? llmArg.split('=')[1] : 'mistral';
  const isRemoteModel = llmModel.startsWith('openai:') || llmModel.startsWith('anthropic:');

  for (const step of cert.plan?.steps || []) {
    let mockInput = step.input;

    const mockPaths = [
      path.join('.dokugent/ops/mocks', step.use || step.tool || '', `${step.id}-input.md`),
      path.join('.dokugent/ops/mocks/custom-tool', `${step.id}-input.md`),
      path.join('.dokugent/ops/mocks', step.use || step.tool || '', `input.md`),
    ];

    let mockInputResolved = mockInput;
    let foundMock = false;

    paddedLog('Mock Resolver', `Attempting to resolve input for: ${step.id}`, PAD_WIDTH, 'purple', 'CHECK MOCK')
    console.log();
    for (const p of mockPaths) {
      console.log(padMsg(`→ Checking: ${p}`));
      if (await fs.pathExists(p)) {
        try {
          mockInputResolved = await fs.readFile(p, 'utf-8');
          foundMock = true;
          console.log(padMsg(`${chalk.green('✔')} Found: ${p}`));
          break;
        } catch {
          console.warn(padMsg(`${chalk.red('ℹ')} Failed to read mock input file: ${p}`));
        }
      }
    }

    if (!foundMock) {
      console.warn(padMsg(`${chalk.red('ℹ')} No specific mock file found for step '${step.id}'. Using raw input field.`));
    }

    // --- HIGH RISK SKIP BLOCK ---
    const trifecta = step.security?.trifecta || [];
    const riskLevel = step.security?.riskLevel || 'Low';

    if (riskLevel === 'High' && !violateMode && !overrideConstraints && !process.argv.includes('--force')) {
      console.warn(`⚠️  Step "${step.id}" is marked HIGH RISK due to:`);
      for (const tag of trifecta) {
        console.warn(`   - ${tag}`);
      }
      console.warn('   → Skipping this step unless --force or override flags are passed.\n');
      continue;
    }
    // --- END HIGH RISK SKIP BLOCK ---

    console.log();
    paddedDefault('', `${step.id || step.name}`, PAD_WIDTH, 'pink', 'STEP');
    paddedDefault('', `${step.use || step.tool}`, PAD_WIDTH, 'pink', 'TOOL');
    console.log();

    // paddedDefault('', `${mockInputResolved}`, PAD_WIDTH, 'success', 'INPUT');
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

    const prompt = `Simulate step "${step.id || step.name}" using tool "${step.use || step.tool}".Input: \n${mockInputResolved}\nConstraints: ${constraintList}.`;

    let output = '';

    if (isRemoteModel) {
      if (llmModel.startsWith('openai:')) {
        const modelName = llmModel.split(':')[1] || 'gpt-4o';
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!OPENAI_API_KEY) {
          throw new Error('❌ Missing OPENAI_API_KEY in environment variables');
        }

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: `You are a simulation agent responding to: ${step.id || step.name}` },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          })
        });

        const json = await openaiRes.json();
        output = json.choices?.[0]?.message?.content || '[No OpenAI response]';
      } else {
        // console.log(`\n🌐 Connecting to REMOTE LLM: ${llmModel}`);
        paddedDefault('Connecting to REMOTE LLM', `${llmModel}`, PAD_WIDTH, 'magenta', 'OLLAMA');
        // Simulate remote fetch (mock or real endpoint)
        output = `[Simulated response from remote model "${llmModel}"]`;
      }
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

    // Optional: write simulated output to the step.output file path if defined
    if (step.output && typeof step.output === 'string' && step.output.endsWith('.md')) {
      try {
        await fs.ensureDir(path.dirname(step.output));
        await fs.writeFile(step.output, output, 'utf-8');
        console.log(`✅ Simulated output written to ${step.output}`);
      } catch (err) {
        if (err instanceof Error) {
          console.warn(`⚠️ Failed to write simulated output to ${step.output}: ${err.message}`);
        } else {
          console.warn(`⚠️ Failed to write simulated output to ${step.output}: ${String(err)}`);
        }
      }
    }

    console.log();
    const wrappedInput = mockInputResolved
      .split('\n')
      .flatMap((line: string) => line.match(/.{1,62}/g) || [''])
      .join('\n');

    ui.box(`ℹ Use Input  \n\n${wrappedInput}`, 'blue', 'left', 'round', PAD_WIDTH);
    // paddedLongText('ℹ Input', '   ' + mockInputResolved, 0, 'magenta');

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
      simulated_input: mockInputResolved,
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
    const wrappedUsedOutput = mockInputResolved
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

// ETHICA council simulation runner
export async function runSimulateViaEthica(ethicaInput: {
  llm?: string;
  configPath?: string;
  debateOnly?: boolean;
  roundtableOnly?: boolean;
  human?: string;
  agents?: string[];
}) {
  // Persona type definition
  type Persona = {
    id: string;
    name: string;
    role: string;
    voice: string;
    goals: string[];
    injectedStatement?: string;
  };

  // Support --roundtable mode (panel, not debate)
  const roundtableMode = !!ethicaInput.roundtableOnly;

  // Persona definitions
  const personas: Persona[] = [
    {
      id: "debate-contrarian",
      name: "Contrarian",
      role: "Challenger of popular opinion",
      voice: "Sharp, concise, skeptical of consensus",
      goals: [
        "Spot blind spots in groupthink",
        "Present counterpoints for every proposed solution",
        "Push for rigor and clarity"
      ]
    },
    {
      id: "debate-disruptor",
      name: "Town Disruptor",
      role: "Agent of productive chaos",
      voice: "Provocative, unfiltered, intentionally challenges comfort zones",
      goals: [
        "Break stagnant patterns of thought",
        "Introduce wild alternatives, even if impractical",
        "Force others to justify their assumptions"
      ]
    }
    // Add other personas here if necessary
  ];

  const config = await fs.readJson(ethicaInput.configPath || '.agent-vault/ethica/config.json');
  // Extract config fields with typing
  let { agents = [], values = [], scenarios = [], outputFormat = 'individual stance' } = config as {
    agents?: string[];
    values?: string[];
    scenarios?: string[];
    outputFormat?: string;
  };
  // CLI-provided agents override config if present
  if (ethicaInput.agents && ethicaInput.agents.length) {
    agents = ethicaInput.agents;
  }
  // Ensure "human" is included if ethicaInput.human is provided
  if (ethicaInput.human && !agents.includes('human')) {
    agents.unshift('human');
  }

  // --- DEBUG LOGGING: ETHICA CONFIG CONTEXT ---
  // Print debug info before scenario loop
  // console.log(chalk.yellow('\n🧠 DEBUG: ETHICA CONFIG CONTEXT'));
  // console.log('────────────────────────────────────────────');
  // console.log('Scenario list loaded:', scenarios.length);
  // console.log('Sample Scenario:', scenarios[0]);
  // console.log('Agents:', agents);
  // console.log('Personas:', personas.map(p => p.id));
  // console.log('Human:', ethicaInput.human);
  // console.log('────────────────────────────────────────────\n');
  // --- END DEBUG LOGGING ---

  // --- Timestamped run output folder setup ---
  const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tracePath = path.join('.agent-vault/ethica/council-out/runs', runTimestamp, 'trace.json');
  const runOutputRoot = path.dirname(tracePath);
  await fs.ensureDir(runOutputRoot);
  const latestSymlink = path.join('.agent-vault/ethica/council-out', 'latest');
  try {
    await fs.remove(latestSymlink);
    await fs.symlink(runOutputRoot, latestSymlink, 'dir');
  } catch { }
  // --- End timestamped folder setup ---

  // Inject human persona if present
  if (ethicaInput.human) {
    agents.push('human');
    personas.push({
      id: 'human',
      name: 'Human',
      role: 'Injected human participant',
      voice: 'Personal, authentic, grounded',
      goals: [
        'Offer real-life reflection',
        'Act as a human voice among the AI council',
        'Share lived experience'
      ]
      // injectedStatement will be added below to all loadedPersonas (see below)
    });
  }

  // Helper: get persona for agent by id
  function getPersonaById(agentId: string): Persona {
    // Fallback object includes injectedStatement as optional
    return personas.find(p => p.id === agentId) || { id: agentId, name: agentId, role: '', voice: '', goals: [] };
  }

  // --- Inject the human statement after personas are loaded ---
  if (ethicaInput.human) {
    personas.forEach(p => {
      if (p.id === 'human') {
        (p as any).injectedStatement = ethicaInput.human;
      }
    });
  }

  for (const scenarioText of scenarios) {
    const scenarioSlug = scenarioText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const suffix = ethicaInput.debateOnly
      ? '-debate'
      : roundtableMode
        ? '-roundtable'
        : '';
    const outFile = path.join(runOutputRoot, `scenario-${scenarioSlug}${suffix}.json`);

    // --- ROUND TABLE MODE ---
    if (roundtableMode) {
      const modeValue = 'roundtable';
      const sharedPrompt = `
You are a council member. Speak independently.
Here are the values guiding this session:
${values.map((v: string) => `- ${v}`).join('\n')}

Scenario:
"${scenarioText}"

Respond in your own voice. Do not address others.
      `.trim();

      const agentResponses: Record<string, string> = {};
      if (ethicaInput.human) {
        agentResponses['human'] = ethicaInput.human;
      }

      for (const agent of agents) {
        const persona = getPersonaById(agent);
        const personaPrompt = [
          persona.name ? `Name: ${persona.name}` : '',
          persona.role ? `Role: ${persona.role}` : '',
          persona.voice ? `Voice: ${persona.voice}` : '',
          persona.goals?.length ? `Goals:\n${persona.goals.map((g: string) => `  - ${g}`).join('\n')}` : ''
        ].filter(Boolean).join('\n');

        // If human agent, skip as already injected above
        if (agent === 'human') {
          continue;
        }

        const systemPrompt = `${personaPrompt}\n\n${sharedPrompt}`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: (ethicaInput.llm || '').replace('openai:', ''),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: scenarioText }
            ],
            temperature: 0.7
          })
        });

        const json = await res.json();
        const reply = json.choices?.[0]?.message?.content || '[No response]';
        agentResponses[agent] = reply;
      }

      // Build output log array (personas) for conversational order
      let roundtableOutput: any[] = [];
      // Insert human input first if present
      if (ethicaInput.human) {
        roundtableOutput.push({
          persona: "Human",
          input: ethicaInput.human,
          role: "user",
          type: "human"
        });
      }
      // Add LLM responses from other agents in order
      for (const agent of agents) {
        if (agent === 'human') continue;
        roundtableOutput.push({
          persona: agent,
          input: agentResponses[agent],
          role: "assistant",
          type: "llm"
        });
      }

      await fs.ensureDir(path.dirname(outFile));
      await fs.writeJson(outFile, {
        scenario: scenarioText,
        agents: agentResponses,
        roundtableOutput,
        values,
        model: ethicaInput.llm,
        mode: modeValue,
        timestamp: new Date().toISOString(),
        disclaimer: "This is an experimental simulation using an LLM. Responses are fictional and for research only."
      }, { spaces: 2 });

      paddedLog('Logged Ethica output', outFile, PAD_WIDTH, 'blue', 'ETHICA');

      // Print debug output to terminal (for roundtable)
      console.log();
      console.log(chalk.cyan(`📣 Ethica Roundtable for: "${scenarioText}"`));
      console.log('────────────────────────────────────────────');
      for (const entry of roundtableOutput) {
        const label = (entry.persona || '').padEnd(12);
        const content = entry.input?.slice(0, 200) || '[No response]';
        console.log(`${chalk.green(label)} → ${content}`);
        console.log();
      }

      continue;
    }
    // --- END ROUND TABLE MODE ---

    const agentResponses: Record<string, string> = {};
    if (ethicaInput.human) {
      agentResponses['human'] = ethicaInput.human;
    }

    for (const agent of agents) {
      // Try to get persona details for this agent
      const persona = getPersonaById(agent);
      // If human agent, skip as already injected above
      if (agent === 'human') {
        continue;
      }
      const personaDetails = [
        persona.name ? `Name: ${persona.name}` : '',
        persona.role ? `Role: ${persona.role}` : '',
        persona.voice ? `Voice: ${persona.voice}` : '',
        persona.goals && persona.goals.length ? `Goals:\n${persona.goals.map((g: string) => `  - ${g}`).join('\n')}` : ''
      ].filter(Boolean).join('\n');

      const systemPrompt = `
You are the ${agent.toUpperCase()}.
${personaDetails ? '\n' + personaDetails + '\n' : ''}
Your role in this council is to represent perspectives shaped by the following values:
${values.map((v: string) => `- ${v}`).join('\n')}

Respond to the following scenario in your own voice. Do not summarize others. Do not hedge.
Always speak from your persona.

Scenario:
"${scenarioText}"
      `.trim();

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) throw new Error('❌ Missing OPENAI_API_KEY');

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: (ethicaInput.llm || '').replace('openai:', ''),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: scenarioText }
          ],
          temperature: 0.7
        })
      });

      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content || '[No response]';
      agentResponses[agent] = reply;
    }

    // Build output log array (personas) for conversational order (for debate or default mode)
    let roundtableOutput: any[] = [];
    if (ethicaInput.human) {
      roundtableOutput.push({
        persona: "Human",
        input: ethicaInput.human,
        role: "user",
        type: "human"
      });
    }
    for (const agent of agents) {
      if (agent === 'human') continue;
      roundtableOutput.push({
        persona: agent,
        input: agentResponses[agent],
        role: "assistant",
        type: "llm"
      });
    }

    await fs.ensureDir(path.dirname(outFile));
    await fs.writeJson(outFile, {
      scenario: scenarioText,
      agents: agentResponses,
      roundtableOutput,
      values,
      model: ethicaInput.llm,
      mode: roundtableMode ? 'roundtable' : (ethicaInput.debateOnly ? 'debate' : 'default'),
      timestamp: new Date().toISOString(),
      disclaimer: "This is an experimental simulation using an LLM. Responses are fictional and for research only."
    }, { spaces: 2 });

    paddedLog('Logged Ethica output', outFile, PAD_WIDTH, 'blue', 'ETHICA');

    // Print debug output to terminal (for debate/default)
    console.log();
    console.log(chalk.cyan(`📣 Ethica Roundtable for: "${scenarioText}"`));
    console.log('────────────────────────────────────────────');
    for (const entry of roundtableOutput) {
      const label = (entry.persona || '').padEnd(12);
      const content = entry.input?.slice(0, 200) || '[No response]';
      console.log(`${chalk.green(label)} → ${content}`);
      console.log();
    }
    console.log();
  }
}
