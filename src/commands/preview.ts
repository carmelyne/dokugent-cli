import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import crypto from 'crypto';
import { runSecurityCheck } from '../utils/security-check';
import { estimateTokensFromText } from '../utils/tokenizer';
import { agents } from '../config/agentsConfig';

const dokugentPath = path.resolve('.dokugent');
const previewPath = path.join(dokugentPath, 'preview');

export async function runPreviewCommand(): Promise<void> {
  let agentKey = 'codex'; // fallback
  const variantKey = null;
  console.log('\n🔐 Running security check before generating preview...');
  await runSecurityCheck();
  console.log('\n✅ Security check passed. Proceeding with preview render.');

  if (fs.existsSync(previewPath)) {
    fs.emptyDirSync(previewPath);
    console.log('\n🧹 Cleared existing preview folder.\n');
  }
  await fs.ensureDir(previewPath);

  const timestamp = new Date().toISOString();
  const metadata = { previewed_by: 'dokugent', timestamp };
  let totalTokens = 0;

  async function mergeMdFiles(srcFolder: string, outName: string) {
    if (!(await fs.pathExists(srcFolder))) {
      console.warn(`⚠️  Skipped: ${srcFolder} not found`);
      return;
    }

    let merged = '';

    async function walkAndMerge(folder: string) {
      const entries = await fs.readdir(folder, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) {
          await walkAndMerge(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf8');
          merged += `\n\n# ${entry.name}\n\n${content}`;
        }
      }
    }

    await walkAndMerge(srcFolder);

    if (!merged.trim()) {
      console.warn(`⚠️  Skipped: No .md files found recursively in ${srcFolder}`);
      return;
    }

    const output = matter.stringify(merged.trim(), metadata);
    await fs.writeFile(path.join(previewPath, outName), output);
    const estimatedTokens = estimateTokensFromText(output);
    totalTokens += estimatedTokens;
    await convertMdToJson(outName, outName.replace('.md', '.json'));
    console.log(`✅ Wrote: ${outName.replace('.md', '.json')} (${estimatedTokens} tokens est.)`);
  }

  await mergeMdFiles(path.join(dokugentPath, 'plan'), 'preview-plan.md');
  await mergeMdFiles(path.join(dokugentPath, 'criteria'), 'preview-criteria.md');

  try {
    const realConventionsPath = await fs.realpath(path.join(dokugentPath, 'conventions', 'dev'));
    // --- Agent key detection logic ---
    try {
      const devFiles = await fs.readdir(realConventionsPath);
      const knownAgents = Object.keys(agents).map(a => a.toLowerCase());
      for (const file of devFiles) {
        const name = path.basename(file, '.md').toLowerCase();
        const match = knownAgents.find(k => name.includes(k));
        if (match) {
          agentKey = match;
          break;
        }
      }
      console.log(`\n🕵️ Detected agent key from conventions/dev/:`);
    } catch {
      console.warn('⚠️ Unable to scan conventions/dev for agent detection. Using default "codex".');
    }
    const devFiles = await fs.readdir(realConventionsPath);
    const knownAgents = Object.keys(agents).map(a => a.toLowerCase());

    for (const file of devFiles) {
      const matchKey = knownAgents.find(agent => file.toLowerCase().includes(agent));
      if (!matchKey) continue;

      const agentMeta = (agents as Record<string, any>)[matchKey];
      const filePath = path.join(realConventionsPath, file);
      const content = await fs.readFile(filePath, 'utf8');

      const output = {
        agent: matchKey,
        label: agentMeta.label,
        maxTokenLoad: agentMeta.maxTokenLoad,
        idealBriefingSize: agentMeta.idealBriefingSize,
        notes: agentMeta.notes,
        tokensEstimated: estimateTokensFromText(content),
        content,
      };

      const outFile = path.join(previewPath, `preview-conventions-${matchKey}.json`);
      await fs.writeFile(outFile, JSON.stringify(output, null, 2));
      totalTokens += output.tokensEstimated;

      console.log(`✅ Wrote: preview-conventions-${matchKey}.json (${output.tokensEstimated} tokens est. / ${output.maxTokenLoad} max token load)`);
    }
  } catch {
    console.warn(`⚠️  Symlink missing or invalid: conventions/dev`);
  }

  const shaLines: string[] = [];
  const files = await fs.readdir(previewPath);

  for (const file of files) {
    const fullPath = path.join(previewPath, file);
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) continue;

    await fs.chmod(fullPath, 0o444);

    const buffer = await fs.readFile(fullPath);
    const sha = crypto.createHash('sha256').update(buffer).digest('hex');
    shaLines.push(`${sha}  ${file}`);
  }

  await fs.writeFile(path.join(previewPath, 'preview.sha256'), shaLines.join('\n'), 'utf8');
  console.log('\n🔒 Preview files were now read-only and a SHA256 integrity file has been generated for tamper detection.\n');

  let activeAgent = (agents as Record<string, any>)[agentKey] || {};
  if (
    typeof activeAgent === 'object' &&
    activeAgent !== null &&
    'variants' in activeAgent &&
    variantKey &&
    (activeAgent as any).variants &&
    (activeAgent as any).variants[variantKey]
  ) {
    activeAgent = (activeAgent as any).variants[variantKey];
  }

  const idealMaxTokens = activeAgent.idealBriefingSize || 4000;

  // console.log(`\n🎯 Agent: ${activeAgent.label || 'Codex'} — ${totalTokens} tokens est. / ${activeAgent.maxTokenLoad || 'N/A'} max token load`);

  if (totalTokens > idealMaxTokens) {
    console.warn(`⚠️ Over the ideal optimal size of ${idealMaxTokens} tokens — consider trimming files.`);
  } else {
    console.log(`✅ Within the ideal optimal size of ${idealMaxTokens} tokens.`);
  }

  if (activeAgent.notes) {
    console.log(`🤖 ${activeAgent.notes.trim()}`);
  }
}

async function convertMdToJson(sourceMd: string, targetJson: string): Promise<number> {
  const fullMdPath = path.join(previewPath, sourceMd);
  const fullJsonPath = path.join(previewPath, targetJson);
  if (!(await fs.pathExists(fullMdPath))) return 0;
  const raw = await fs.readFile(fullMdPath, 'utf8');
  const parsed = matter(raw);
  const tokenCount = estimateTokensFromText(parsed.content);
  const json = {
    metadata: parsed.data,
    content: parsed.content.trim(),
    tokens: tokenCount,
  };
  await fs.writeJson(fullJsonPath, json, { spaces: 2 });
  return tokenCount;
}