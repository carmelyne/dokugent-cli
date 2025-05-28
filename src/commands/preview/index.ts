import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

export async function runPreviewCommand(): Promise<void> {
  const base = '.dokugent/data';

  // Resolve agent
  const agentCurrent = path.join(base, 'agents', 'current');
  const agentLatest = path.join(base, 'agents', 'latest');
  const agentDir = (await fs.pathExists(agentCurrent)) ? agentCurrent : agentLatest;
  //.dokugent/data/agents/current/identity.json
  const agentMetaPath = path.join(agentDir, 'identity.json');

  // Resolve plan
  //.dokugent/data/plans/latest/plan.json
  const planPath = path.join(base, 'plans', 'latest', 'plan.json');

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
    agent,
    plan: planJson,
    conventions: [conventions], // embed CODEX.md or README.md content
    owner,
    signingKeyVersion: path.basename(path.dirname(ownerPath)),
    fingerprint: owner.fingerprint,
  };

  // Load and parse criteria
  const criteriaPath = path.join(base, 'criteria', 'latest', 'criteria.json');
  const criteriaExists = await fs.pathExists(criteriaPath);
  if (criteriaExists) {
    certObject.criteria = await fs.readJson(criteriaPath);
  } else {
    certObject.criteria = { error: 'criteria.json not found in latest' };
  }

  console.log(JSON.stringify(certObject, null, 2));
}
