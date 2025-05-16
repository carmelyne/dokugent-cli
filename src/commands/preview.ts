/**
 * @file preview.ts
 * @description Generates a preview from the working agent spec, plan, criteria, and conventions.
 * Converts markdown sources to JSON, estimates token counts, and prepares integrity hashes for certification.
 */
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import crypto from 'crypto';
import { runSecurityCheck } from '../utils/security-check';
import { estimateTokensFromText } from '../utils/tokenizer';
import { agents } from '../config/agentsConfig';
import { previewWizard } from '../utils/wizards/preview-wizard';
import { updateSymlink } from '../utils/symlink-utils';

/**
 * Executes the preview process by extracting agent data from markdown,
 * converting it to JSON, and preparing files for certification.
 *
 * Responsibilities:
 * - Converts specs, plans, criteria, and conventions to `.json` format.
 * - Estimates token usage and logs total token count.
 * - Sets files to read-only and generates a SHA256 checksum manifest.
 * - Writes a preview report and log, and updates the preview symlink.
 *
 * @returns {Promise<void>}
 */
export async function runPreviewCommand(): Promise<void> {
  const wizard = await previewWizard();
  if (!wizard) return;

  const { agent: agentKey, devMode } = wizard;
  const variantKey = undefined;

  const dokugentPath = path.resolve('.dokugent');
  const previewRoot = path.join(dokugentPath, 'preview');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const previewPath = path.join(previewRoot, `preview-${timestamp}`);

  console.log('\n🔐 Running security check before generating preview...');
  await runSecurityCheck();
  console.log('\n✅ Security check passed. Proceeding with preview render.');

  if (fs.existsSync(previewPath)) {
    fs.emptyDirSync(previewPath);
    console.log('\n🧹 Cleared existing preview folder.\n');
  }
  await fs.ensureDir(previewPath);

  const metadata = { previewed_by: 'dokugent', timestamp };
  let totalTokens = 0;

  // --- Agent spec preview extraction ---
  const specRoot = path.join(dokugentPath, 'agent-info', 'agents', 'agent-spec', 'init');
  const specPreviewRoot = path.join(previewPath, 'specs');
  if (await fs.pathExists(specRoot)) {
    const agentDirs = await fs.readdir(specRoot);
    for (const agentDir of agentDirs) {
      const srcDir = path.join(specRoot, agentDir);
      const destDir = path.join(specPreviewRoot, agentDir);
      await fs.ensureDir(destDir);

      for (const filename of ['agent-spec.md', 'tool-list.md']) {
        const srcFile = path.join(srcDir, filename);
        const jsonFile = path.join(destDir, filename.replace('.md', '.json'));
        if (await fs.pathExists(srcFile)) {
          const raw = await fs.readFile(srcFile, 'utf8');
          const parsed = matter(raw);
          const tokenCount = estimateTokensFromText(parsed.content);
          const json = {
            metadata: parsed.data,
            content: parsed.content.trim(),
            tokens: tokenCount,
          };
          await fs.writeJson(jsonFile, json, { spaces: 2 });
          totalTokens += tokenCount;
          console.log(`✅ Wrote: specs/${agentDir}/${path.basename(jsonFile)} (${tokenCount} tokens est.)`);
        }
      }
    }
  }

  async function mergeMdFiles(srcFolder: string, outName: string, previewPath: string) {
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
    await convertMdToJson(previewPath, outName, outName.replace('.md', '.json'));
    await fs.remove(path.join(previewPath, outName));
    console.log(`✅ Wrote: ${outName.replace('.md', '.json')} (${estimatedTokens} tokens est.)`);
  }

  await mergeMdFiles(path.join(dokugentPath, 'plan'), 'preview-plan.md', previewPath);
  await mergeMdFiles(path.join(dokugentPath, 'criteria'), 'preview-criteria.md', previewPath);

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
          // agentKey = match; // We keep agentKey from wizard, so do not overwrite here
          break;
        }
      }
      console.log(`\n🕵️ Detected agent key from conventions/dev:`);
    } catch {
      console.warn('⚠️ Unable to scan conventions/dev for agent detection. Using default "codex".');
    }
    const filePath = path.join(realConventionsPath, `${devMode}.md`);
    if (await fs.pathExists(filePath)) {
      const agentMeta = (agents as Record<string, any>)[devMode] || {};
      const content = await fs.readFile(filePath, 'utf8');
      const output = {
        agent: devMode,
        label: agentMeta.label,
        maxTokenLoad: agentMeta.maxTokenLoad,
        idealBriefingSize: agentMeta.idealBriefingSize,
        notes: agentMeta.notes,
        tokensEstimated: estimateTokensFromText(content),
        content,
      };
      const outFile = path.join(previewPath, `preview-conventions-${devMode}.json`);
      await fs.writeFile(outFile, JSON.stringify(output, null, 2));
      totalTokens += output.tokensEstimated;
      console.log(`✅ Wrote: preview-conventions-${devMode}.json (${output.tokensEstimated} tokens est. / ${output.maxTokenLoad || 'N/A'} max token load)`);
    }
  } catch {
    console.warn(`⚠️  Symlink missing or invalid: conventions/dev`);
  }

  const files = await fs.readdir(previewPath);

  const shaLines: string[] = [];
  for (const file of files) {
    const fullPath = path.join(previewPath, file);
    const stat = await fs.stat(fullPath);
    if (
      !stat.isFile() ||
      file.endsWith('.log') ||
      file.endsWith('.report.json')
    ) continue;

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
    (activeAgent as any).variants?.[variantKey]
  ) {
    activeAgent = (activeAgent as any).variants?.[variantKey];
  }

  const idealMaxTokens = activeAgent.idealBriefingSize || 4000;

  // console.log(`\n🎯 Agent: ${activeAgent.label || 'Codex'} — ${totalTokens} tokens est. / ${activeAgent.maxTokenLoad || 'N/A'} max token load`);

  if (totalTokens > idealMaxTokens) {
    console.warn(`⚠️ Over the ideal optimal size of ${idealMaxTokens} tokens — consider trimming files.`);
  } else {
    console.log(`✅ Total token estimate across all preview files is within the ideal maximum of ${idealMaxTokens} tokens.\n`);
  }

  // if (activeAgent.notes) {
  //   console.log(`🤖 ${activeAgent.notes.trim()}`);
  // }

  // Updated section for writing preview log and report
  const previewLogLines: string[] = [
    `🕓 Preview generated at ${new Date().toISOString()}`,
    `📁 Files in preview: ${files.length}`,
    `🔒 SHA256 file created`,
    `🔢 Estimated total tokens: ${totalTokens}`,
  ];

  const previewReport: Record<string, any> = {
    timestamp,
    estimated_tokens: totalTokens,
    detected_agent: agentKey,
    preview_files: files,
    sha256_entries: shaLines,
  };

  const logsDir = path.join(dokugentPath, 'logs', 'preview');
  const reportsDir = path.join(dokugentPath, 'reports', 'preview');
  await fs.ensureDir(logsDir);
  await fs.ensureDir(reportsDir);
  await fs.writeFile(path.join(logsDir, `preview-${timestamp}.log`), previewLogLines.join('\n'), 'utf8');
  await fs.writeJson(path.join(reportsDir, `preview-${timestamp}.json`), previewReport, { spaces: 2 });

  if (files.length > 0) {
    console.log('\n📁 Note: `.dokugent/preview` files were generated and read-only.');
  }

  // Update the latest symlink using shared utility
  await updateSymlink(previewRoot, 'latest', path.basename(previewPath));
}

async function convertMdToJson(previewPath: string, sourceMd: string, targetJson: string): Promise<number> {
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