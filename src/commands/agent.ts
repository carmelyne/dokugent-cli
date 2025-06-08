import { promptAgentWizard } from '@utils/wizards/agent-wizard';
import { confirmAndWriteFile } from '@utils/fs-utils';
import fs from 'fs';
import path from 'path';
import { getTimestamp } from '@utils/timestamp';
import { estimateTokensFromText } from '@utils/tokenizer';
import {
  showAgentIdentity,
  editAgentIdentity,
  validateAgentIdentity,
  resolveAgentSlugFromArgs
} from '@utils/agent-utils';
import { agentLs, setAgentCurrent } from '@utils/ls-utils';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, phaseHeader } from '@utils/cli/ui';

export function runAgentCommand() {
  (async () => {
    const templateIndex = process.argv.indexOf('--t');
    const ecosystemIndex = process.argv.indexOf('--e');
    if (templateIndex !== -1 && process.argv[templateIndex + 1]) {
      const agentName = process.argv[templateIndex + 1];
      const ecosystem = ecosystemIndex !== -1 ? process.argv[ecosystemIndex + 1] : 'none';
      const timestamp = getTimestamp();
      const agentId = `${agentName}@${timestamp}`;
      const agentDir = path.resolve('.dokugent/data/agents', agentId);
      fs.mkdirSync(agentDir, { recursive: true });

      const identity = {
        agentName,
        description: '',
        roles: [],
        contentTypes: [],
        owner: '',
        ownerId: '',
        task: '',
        requiresConventions: false,
        ecosystem
      };
      const identityPath = path.join(agentDir, 'identity.json');
      fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2));
      // console.log(`💾 Saved: ${identityPath}`);

      if (ecosystem !== 'none') {
        const presetPath = path.resolve('src/presets/ecosystems', ecosystem);
        const targetEcosystemPath = path.join(agentDir, 'ecosystems', ecosystem);
        if (fs.existsSync(presetPath)) {
          fs.mkdirSync(targetEcosystemPath, { recursive: true });
          fs.cpSync(presetPath, targetEcosystemPath, { recursive: true });
          console.log(`📦 Presets copied from ecosystem: ${ecosystem}`);
        } else {
          console.warn(`⚠️ Preset path not found: ${presetPath}`);
        }
      }

      const summary = [
        identity.agentName,
        identity.description,
        identity.roles.join(','),
        identity.contentTypes.join(','),
        identity.task
      ].join(' ');
      const tokenEstimate = estimateTokensFromText(summary);
      console.log(`\n🧮 Estimated agent profile tokens: \x1b[32m~${tokenEstimate} tokens\x1b[0m`);
      console.log(`\n✅ Next: \x1b[34mdokugent preview --agent ${agentId}\x1b[0m\n`);
      process.exit(0);
    }

    if (process.argv.includes('--show')) {
      const slug = resolveAgentSlugFromArgs(process.argv);
      showAgentIdentity(slug);
      return;
    }

    if (process.argv.includes('--edit')) {
      const slug = resolveAgentSlugFromArgs(process.argv);
      editAgentIdentity(slug);
      return;
    }

    if (process.argv.includes('--check')) {
      const slug = resolveAgentSlugFromArgs(process.argv);
      validateAgentIdentity(slug);
      return;
    }

    if (process.argv.includes('--ls') || process.argv.includes('ls')) {
      await agentLs();
      return;
    }

    const useIndex = process.argv.indexOf('--use');
    if (useIndex !== -1 && process.argv[useIndex + 1]) {
      const slug = process.argv[useIndex + 1];
      await setAgentCurrent(slug);
      return;
    }
    paddedCompact('dokugent agent initialized...', '', PAD_WIDTH, 'info');
    console.log()
    // fallback to wizard
    const answers = await promptAgentWizard();
    const typedAnswers = {
      ...answers,
      ecosystem: answers.ecosystem,
      birth: getTimestamp(),
    };
    const timestamp = getTimestamp();
    const agentId = `${typedAnswers.agentName}@${timestamp}`;
    typedAnswers.birth = timestamp;
    const targetPath = path.resolve('.dokugent/data/agents', agentId, 'identity.json');
  })();
}
