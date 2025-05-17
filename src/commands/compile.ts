/**
 * @file compile.ts
 * @description Bundles all certified files into a compiled JSON file with SHA256 hash,
 * creates symlinks to the latest bundle, and logs audit information.
 */
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
// other imports...
import { DokuVoltAssembler } from '../utils/doku-volt';

/**
 * Compiles certified agent files into a finalized, hashed, and versioned bundle.
 *
 * Responsibilities:
 * - Resolves timestamp from the certified symlink target.
 * - Reads all `.cert.json` and `.cert.md` files from the flat directory.
 * - Prefixes filenames with agent for uniqueness.
 * - Generates SHA256 hash of compiled bundle.
 * - Writes `.json`, `.sha256`, and creates `latest` symlinks.
 * - Logs compile metadata to report and log files.
 *
 * @returns {Promise<void>} Resolves after compile completes.
 */

/**
 * Compiled Doku Volt metadata example:
 *
 * {
 *  "agent": "summarybot",
 *  "owner": "kinderbytes",
 *  "signer": "key-ed25519-01.pem",
 *  "mainTask": "Summarize input as 3 bullet points",
 *  "version": "2025-05-17T10:12:04Z",
 *  "uri": "doku:agent/summarybot@2025-05-17.kinderbytes",
 *  "tools": ["openai-chat", "markdown-cleaner"],
 *  "planSteps": [
 *   "summarize_input",
 *   "reformat_output",
 *   "check_bullets"
 *   ],
 *  "criteria": ["must have 3 bullets", "max 200 words"],
 *  "conventions": ["formal tone", "English only"]
 */

async function compile() {
  const agent = 'default-agent';
  const latestRealPath = await fs.realpath(path.join(process.cwd(), '.dokugent', 'certified', 'latest'));
  const timestamp = path.basename(latestRealPath).replace(`-${agent}`, '');
  const dokugentPath = path.join(process.cwd(), '.dokugent');
  const compiledFilePath = path.join(dokugentPath, 'compiled', `compiled-${timestamp}-${agent}.json`);
  let compiledSha = '';
  const versionTag = 'v1.0.0';

  console.log('\n🛠️ Starting compile process...');
  console.log(`🕒 timestamp: ${timestamp}`);
  console.log(`\n📁 dokugentPath: ${dokugentPath}`);
  console.log(`\n📦 compiledFilePath:`);
  console.log(`   ${path.relative(process.cwd(), compiledFilePath)}`);
  // (moved log for compiledSha after it's computed)

  // Flattened source directory from certified/latest symlink
  const latestDir = path.join(dokugentPath, 'certified', 'latest');
  const specsDir = latestDir;

  const files: Record<string, any> = {};
  let allFiles: string[] = [];

  if (await fs.pathExists(specsDir)) {
    console.log(`\n📂 Scanning specsDir: ${specsDir}`);
    const specsFiles = (await fs.readdir(specsDir))
      .filter(f => f.endsWith('.cert.json') || f.endsWith('.cert.md'))
      .map(f => path.join(specsDir, f));
    allFiles.push(...specsFiles);
  }

  console.log('\n📄 Files to compile:', allFiles.map(f => path.basename(f)));

  for (const filePath of allFiles) {
    const file = path.basename(filePath);
    try {
      if (file.endsWith('.cert.json')) {
        const json = await fs.readJson(filePath);
        const content = json.content || '';
        files[`${agent}-${file}`] = content
          ? {
            metadata: {},
            content,
            tokens: content.split(/\s+/).filter(Boolean).length
          }
          : {
            metadata: {},
            content: JSON.stringify(json, null, 2),
            tokens: JSON.stringify(json).split(/\s+/).filter(Boolean).length
          };
      } else if (file.endsWith('.cert.md')) {
        const content = await fs.readFile(filePath, 'utf8');
        files[`${agent}-${file}`] = {
          metadata: {},
          content,
          tokens: content.split(/\s+/).filter(Boolean).length
        };
      }
    } catch {
      files[`${agent}-${file}`] = null;
    }
  }
  const bundle = {
    metadata: {
      compiled_at: timestamp,
      version: versionTag,
      agent,
    },
    files
  };

  // existing compile logic...

  // Remove existing compiled output to prevent EACCES due to read-only flag
  if (await fs.pathExists(compiledFilePath)) {
    await fs.chmod(compiledFilePath, 0o666); // make writable before delete
    await fs.remove(compiledFilePath);
  }
  await fs.writeJson(compiledFilePath, bundle, { spaces: 2 });

  compiledSha = crypto.createHash('sha256').update(JSON.stringify(bundle, null, 2)).digest('hex');
  console.log(`\n🔐 compiledSha: ${compiledSha}\n`);

  const compiledShaPath = compiledFilePath.replace(/\.json$/, '.sha256');
  await fs.writeFile(compiledShaPath, compiledSha, 'utf8');

  await fs.chmod(compiledFilePath, 0o444);

  // Create symlinks to latest compile result and sha256
  const latestJsonLink = path.join(path.dirname(compiledFilePath), 'latest.json');
  const latestShaLink = path.join(path.dirname(compiledFilePath), 'latest.sha256');
  try {
    await fs.remove(latestJsonLink);
    await fs.remove(latestShaLink);
  } catch { }
  await fs.symlink(path.basename(compiledFilePath), latestJsonLink);
  await fs.symlink(path.basename(compiledShaPath), latestShaLink);

  // Insert DOKU canonical compiled.json creation before writing compile report/logs
  try {
    const dokuMetaPath = path.join(latestDir, 'doku.json');
    const planPath = path.join(latestDir, 'plan.cert.json');
    const toolsPath = path.join(latestDir, 'tool-list.cert.json');
    const criteriaPath = path.join(latestDir, 'criteria.cert.json');
    const conventionsPath = path.join(latestDir, 'conventions.cert.json');

    const [dokuMeta, plan, toolList, criteria, conventions] = await Promise.all([
      fs.readJson(dokuMetaPath),
      fs.readJson(planPath),
      fs.readJson(toolsPath),
      fs.readJson(criteriaPath),
      fs.readJson(conventionsPath)
    ]);

    const volt = new DokuVoltAssembler();
    volt.setInit({ agent: dokuMeta.agent || agent, owner: dokuMeta.owner, mainTask: dokuMeta.mainTask || dokuMeta.summary });
    volt.setSigner(dokuMeta.signer || 'unknown');
    volt.setVersion(timestamp);
    volt.setURI(dokuMeta.uri || `doku:agent/${dokuMeta.agent || agent}@${timestamp}.${dokuMeta.owner}`);
    volt.setTools(toolList.map((t: any) => t.name));
    volt.setPlanSteps(plan.map((p: any) => p.name));
    volt.setCriteria(criteria.map((c: any) => c.description || c));
    volt.setConventions(conventions.map((c: any) => c.rule || c));

    const compiledMeta = volt.getVolt();

    const simplifiedCompiledPath = path.join(dokugentPath, 'compiled', 'compiled.json');
    await fs.writeJson(simplifiedCompiledPath, compiledMeta, { spaces: 2 });
  } catch (err) {
    console.warn('⚠️ Failed to write compiled.json:', (err as any).message);
  }

  const reportsDir = path.join(dokugentPath, 'reports', 'compile');
  const logsDir = path.join(dokugentPath, 'logs', 'compile');
  await fs.ensureDir(reportsDir);
  await fs.ensureDir(logsDir);

  const reportPath = path.join(reportsDir, `compile@${timestamp}.json`);
  const logPath = path.join(logsDir, `compile@${timestamp}.log`);

  const compileReport = {
    compiled_at: timestamp,
    output_file: compiledFilePath,
    sha256: compiledSha,
    agent,
    files_included: Object.keys(bundle.files),
  };

  console.log('📝 Writing compile report and log files...');
  await fs.writeJson(reportPath, compileReport, { spaces: 2, flag: 'w' });
  await fs.writeFile(
    logPath,
    `✅ Compile completed at ${timestamp} for agent "${agent}"\nOutput: ${compiledFilePath}\nSHA256: ${compiledSha}\n`,
    { encoding: 'utf8', flag: 'w' }
  );
  const totalTokens = Object.values(files).reduce((acc, file) => acc + (file?.tokens || 0), 0);
  console.log(`\n🔢 \x1b[35mTotal tokens:\x1b[0m ${totalTokens}`);
  console.log('\n✨ Dokugent Compile Success!!! ✨\n');
}

export { compile as runCompileCommand };

if (require.main === module) {
  compile();
}
