import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { loadBlacklist } from '@security/loaders';
import { updateSymlink } from '@utils/symlink-utils';

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
  //.dokugent/data/conventions/dev/latest/
  const conventionsDir = path.join(base, 'conventions', 'dev', 'latest');
  // TODO: Handle multiple convention types
  const conventionsMetaPath = path.join(conventionsDir, 'conventions.meta.json');

  // Resolve owner (multi-owner strategy)
  const ownerDir = path.join('.dokugent/keys', 'owners');
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

  const ownerJsonFile = `${selectedOwner}.meta.json`;
  const ownerLatestDir = path.join(ownerDir, selectedOwner, 'latest');
  const ownerPath = path.join(ownerLatestDir, ownerJsonFile);

  const exists = await fs.pathExists(ownerPath);
  if (!exists) {
    throw new Error(`❌ Expected owner file '${ownerJsonFile}' not found in .dokugent/keys/owners/${selectedOwner}/latest`);
  }

  const [agent, planJson, conventionsRaw, owner] = await Promise.all([
    fs.readJson(agentMetaPath),
    fs.readJson(planPath),
    fs.readJson(conventionsMetaPath),
    fs.readJson(ownerPath),
  ]);

  for (const item of conventionsRaw.conventions) {
    const filePath = path.join(conventionsDir, item.file);
    item.content = await fs.readFile(filePath, 'utf-8');
  }

  const conventions = conventionsRaw;

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
    conventions: conventions,
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

  // Count tokens in the certificate object
  console.log(JSON.stringify(certObject, null, 2));
  const tokenSummary = estimateTokensFromText(JSON.stringify(certObject));
  const tokenCount = typeof tokenSummary === 'number' ? tokenSummary : (tokenSummary as any)?.total ?? 'N/A';

  console.log('\n🧠 Estimated Token Usage: \x1b[32m%s\x1b[0m\n', tokenCount);

  // Write preview JSON file with agent identity in filename
  const agentName = agent.agentName;
  const agentId = planJson.agentId;
  const previewDir = path.join('.dokugent/ops', 'previews', agentName);
  const previewFile = path.join(
    previewDir,
    `${agentName}@${agentId.split('@')[1]}_preview.json`
  );
  await fs.ensureDir(previewDir);

  // Always delete existing preview file first
  if (await fs.pathExists(previewFile)) {
    await fs.chmod(previewFile, 0o644); // ensure it's writable
    await fs.remove(previewFile);
  }

  await fs.writeJson(previewFile, certObject, { spaces: 2 });

  // Create or update symlink to latest preview
  const previewLatestPath = path.join('.dokugent/ops', 'previews', 'latest');
  try {
    await fs.remove(previewLatestPath);
  } catch { }
  await fs.symlink(path.resolve(previewDir), previewLatestPath, 'dir');

  // Run security check
  const denyList = await loadBlacklist();

  const scanPaths = [
    planDir,
    criteriaDir,
    conventionsDir,
    ownerDir
  ];

  const securityIssues = await runSecurityCheck('preview', {
    denyList,
    requireApprovals: false,
    scanPaths
  });

  if (securityIssues.length === 0) {
    console.log(`\n🔍 Files scanned:`);
    scanPaths.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log(`\n`);
  }

  await fs.chmod(previewFile, 0o444);
}
