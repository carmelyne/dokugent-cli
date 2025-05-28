import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '../../utils/tokenizer';

export async function runPreviewCommand(): Promise<void> {
  const base = '.dokugent/data';

  // Resolve agent
  const agentCurrent = path.join(base, 'agents', 'current');
  const agentLatest = path.join(base, 'agents', 'latest');
  const agentDir = (await fs.pathExists(agentCurrent)) ? agentCurrent : agentLatest;
  //.dokugent/data/agents/current/identity.json
  const agentMetaPath = path.join(agentDir, 'identity.json');

  // Resolve plan
  const planDir = (await fs.pathExists(path.join(base, 'plans', 'current')))
    ? path.join(base, 'plans', 'current')
    : path.join(base, 'plans', 'latest');
  const planPath = path.join(planDir, 'plan.json');

  // Resolve conventions (defaulting to dev)
  //.dokugent/data/conventions/dev/latest/CODEX.md [example only]
  const conventionsDir = path.join(base, 'conventions', 'dev', 'latest');
  // TODO: Handle multiple convention types
  const conventionReadme = path.join(conventionsDir, 'CODEX.md');

  // Resolve owner (multi-owner strategy)
  const ownerDir = path.join(base, 'owners');
  const owners = await fs.readdir(ownerDir);

  let selectedOwner = owners[0];
  if (owners.length > 1) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '❓ Who should be used as signing identity?',
        choices: owners,
      },
    ]);
    selectedOwner = selected;
  }

  const ownerJsonFile = `owner.${selectedOwner}.json`;
  const ownerPath = path.join(ownerDir, selectedOwner, ownerJsonFile);

  const exists = await fs.pathExists(ownerPath);
  if (!exists) {
    throw new Error(`❌ Expected owner file '${ownerJsonFile}' not found in ${path.join(ownerDir, selectedOwner)}`);
  }

  // Utility function to parse markdown to JSON (improved: headings and lists)
  function parseMarkdownToJson(markdown: string): Record<string, any> {
    const lines = markdown.split('\n');
    const json: Record<string, any> = {};
    let currentKey = '';
    let buffer: string[] = [];
    let started = false;

    const flushBuffer = () => {
      const content = buffer.join('\n').trim();
      const allList = buffer.every(line => line.trim().startsWith('- '));
      if (allList) {
        json[currentKey] = buffer.map(item => item.trim().slice(2).trim());
      } else {
        json[currentKey] = content;
      }
      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = line.match(/^##+\s+(.*)/);
      if (headingMatch) {
        if (!started) started = true;
        if (currentKey) flushBuffer();
        currentKey = headingMatch[1].trim();
      } else if (started) {
        buffer.push(line);
      }
    }

    if (currentKey) flushBuffer();

    return json;
  }

  const [agent, planJson, conventions, owner] = await Promise.all([
    fs.readJson(agentMetaPath),
    fs.readJson(planPath),
    fs.readFile(conventionReadme, 'utf-8'),
    fs.readJson(ownerPath),
  ]);

  const certObject: any = {
    agent: {
      ...agent,
      avatar: {
        imageUrl: '',
        style: '',
        voice: '',
        persona: ''
      }
    },
    plan: planJson,
    criteria: undefined,
    conventions: [conventions], // embed CODEX.md or README.md content
    owner,
    fingerprint: owner.fingerprint,
    signingKeyVersion: path.basename(path.dirname(ownerPath))
  };

  // Load and parse criteria
  const criteriaDir = (await fs.pathExists(path.join(base, 'criteria', 'current')))
    ? path.join(base, 'criteria', 'current')
    : path.join(base, 'criteria', 'latest');
  const criteriaPath = path.join(criteriaDir, 'criteria.json');
  const criteriaExists = await fs.pathExists(criteriaPath);
  if (criteriaExists) {
    certObject.criteria = await fs.readJson(criteriaPath);
  } else {
    certObject.criteria = { error: 'criteria.json not found in current/latest' };
  }

  console.log(JSON.stringify(certObject, null, 2));
  const tokenSummary = estimateTokensFromText(JSON.stringify(certObject));
  const tokenCount = typeof tokenSummary === 'number' ? tokenSummary : (tokenSummary as any)?.total ?? 'N/A';
  console.log('\n🧠 Estimated Token Usage: \x1b[32m%s\x1b[0m\n', tokenCount);

  // Write preview JSON file with agent identity in filename
  const agentName = agent.agentName;
  const agentId = planJson.agentId;
  const previewDir = path.join(base, 'preview', agentName);
  const previewFile = path.join(
    previewDir,
    `${agentName}@${agentId.split('@')[1]}_preview.json`
  );
  await fs.ensureDir(previewDir);
  await fs.writeJson(previewFile, certObject, { spaces: 2 });
}
