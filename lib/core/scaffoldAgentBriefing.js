import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { folderGroups } from '../config/scaffold-groups.js';

function scaffoldAgentBriefing(llm = 'claude') {
  const supportedAgents = ['claude', 'codex'];
  if (!supportedAgents.includes(llm)) {
    console.error(`❌ Unsupported agent: ${llm}`);
    return;
  }

  const basePath = path.resolve('.dokugent/compiled-agent-specs');
  fs.ensureDirSync(basePath);

  const folders = { ...folderGroups.core, ...folderGroups.addons };
  const outputPath = path.join(basePath, `${llm}.md`);
  const lines = [];

  Object.entries(folders).forEach(([folder, files]) => {
    files.forEach(file => {
      const filePath = path.join('.dokugent', folder, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        lines.push(`## ${folder}/${file}\n\n${content.trim()}\n`);
      }
    });
  });

  let tokenLimit = 6000;
  let warnIfExceeds = true;

  const llmConfigPath = path.join('.dokugent', 'llm-load.yml');
  if (fs.existsSync(llmConfigPath)) {
    try {
      const config = yaml.load(readFileSync(llmConfigPath, 'utf8'));
      tokenLimit = config.tokenLimit || tokenLimit;
      warnIfExceeds = config.warnIfExceeds !== false;
    } catch (e) {
      console.warn('⚠️ Failed to read llm-load.yml, using defaults.');
    }
  }

  const outputContent = lines.join('\n');
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  const estimatedTokens = Math.round(outputContent.length / 4);
  console.log(`🧠 Agent spec created: compiled-agent-specs/${llm}.md`);
  console.log(`📊 Estimated token size: ~${estimatedTokens} tokens`);

  if (warnIfExceeds && estimatedTokens > tokenLimit) {
    console.warn(`⚠️ Warning: Briefing may exceed ideal load (${tokenLimit} tokens).
    Consider simplifying or using llm-load.yml to exclude bulky files.`);
  }
}

export { scaffoldAgentBriefing };