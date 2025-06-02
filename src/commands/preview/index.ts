import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { loadBlacklist } from '@security/loaders';
import { updateSymlink } from '@utils/symlink-utils';
import crypto from 'crypto';

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

  // Resolve previewer (multi-previewer strategy)
  const previewerDir = path.join('.dokugent/keys', 'signers');
  const previewers = await fs.readdir(previewerDir);

  let selectedPreviewer = previewers[0];
  if (previewers.length > 1) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '❓ Who should be used as signing previewer identity?',
        choices: previewers,
      },
    ]);
    selectedPreviewer = selected;
  }

  const previewerJsonFile = `${selectedPreviewer}.meta.json`;
  const previewerLatestDir = path.join(previewerDir, selectedPreviewer, 'latest');
  const previewerPath = path.join(previewerLatestDir, previewerJsonFile);

  const previewerExists = await fs.pathExists(previewerPath);
  if (!previewerExists) {
    throw new Error(`❌ Expected previewer file '${previewerJsonFile}' not found in .dokugent/keys/signers/${selectedPreviewer}/latest`);
  }

  // Resolve owner selection
  const ownerDirs = await fs.readdir(path.join('.dokugent', 'data', 'owners'));
  let selectedOwner = ownerDirs[0];
  if (ownerDirs.length > 1) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '❓ Who should be used as owner identity?',
        choices: ownerDirs,
      },
    ]);
    selectedOwner = selected;
  }

  // Resolve owner path from .dokugent/data/owners
  const ownersDataDir = path.join('.dokugent', 'data', 'owners');
  const ownerJsonFile = `owner.${selectedOwner}.json`;
  const ownerPath = path.join(ownersDataDir, selectedOwner, ownerJsonFile);
  const ownerExists = await fs.pathExists(ownerPath);
  if (!ownerExists) {
    throw new Error(`❌ Expected owner file '${ownerJsonFile}' not found in .dokugent/data/owners/${selectedOwner}`);
  }

  const [agent, planJson, conventionsRaw, owner, previewer] = await Promise.all([
    fs.readJson(agentMetaPath),
    fs.readJson(planPath),
    fs.readJson(conventionsMetaPath),
    fs.readJson(ownerPath),
    fs.readJson(previewerPath),
  ]);
  // Inject correct previewer name from folder context
  previewer.previewerName = selectedPreviewer;

  for (const item of conventionsRaw.conventions) {
    const filePath = path.join(conventionsDir, item.file);
    item.content = await fs.readFile(filePath, 'utf-8');
  }

  const conventions = conventionsRaw;

  const ownerData = {
    ownerName: owner.owner_name ?? owner.name ?? path.basename(path.dirname(ownerPath)),
    email: owner.email,
    trustLevel: owner.trustLevel,
    organization: owner.organization,
    createdAt: owner.createdAt
  };

  const previewerData = {
    previewerName: previewer.previewerName,
    email: previewer.email,
    publicKey: previewer.publicKey,
    fingerprint: previewer.fingerprint ?? crypto.createHash('sha256').update(previewer.publicKey).digest('hex'),
    previewKeyVersion: path.basename(path.dirname(previewerPath))
  };

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
    owner: ownerData,
    previewer: previewerData,
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
    previewerDir,
    ownersDataDir
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
