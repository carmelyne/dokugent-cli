import { promptAgentWizard } from '../utils/wizards/agent-wizard';
import { confirmAndWriteFile } from '../utils/fs-utils';
import fs from 'fs';
import path from 'path';
import { getTimestamp } from '../utils/timestamp';
import { estimateTokensFromText } from '../utils/tokenizer';
import {
  showAgentIdentity,
  editAgentIdentity,
  validateAgentIdentity,
  resolveAgentSlugFromArgs
} from '../utils/agent-utils';

export function runAgentCommand() {
  (async () => {
    if (process.argv.includes('--t')) {
      const templateData = {
        name: 'sample_agent',
        description: 'A starting agent identity template',
        roles: ['summarizer'],
        contentTypes: ['english', 'markdown'],
        owner: 'Kinderbytes',
        ownerId: 'kinderbytes.org',
        task: 'Summarize input into 3 key points'
      };

      const slug = `${templateData.name}@${getTimestamp()}`;
      const agentDir = path.resolve('.dokugent/data/agents', slug);
      fs.mkdirSync(agentDir, { recursive: true });

      const outPath = path.join(agentDir, 'identity.json');
      fs.writeFileSync(outPath, JSON.stringify(templateData, null, 2));

      const summary = [
        templateData.name,
        templateData.description,
        templateData.roles?.join(','),
        templateData.contentTypes?.join(','),
        templateData.task
      ].join(' ');
      const tokenEstimate = estimateTokensFromText(summary);

      console.log(`\n🧮 Estimated agent profile tokens: \x1b[32m~${tokenEstimate} tokens\x1b[0m`);
      console.log(`\n💾 Sample agent file created:\n   .dokugent/data/agents/${slug}/identity.json`);
      console.log(`\n✏️  You can edit this agent before planning.`);
      console.log(`\n⚠️  If you change the "name" field in the file,\n   also rename the folder to match.`);
      // TODO: Add support for `--clean` to auto-rename folder to match updated agent name
      console.log(`\n✅  Next: \x1b[34mdokugent plan --agent ${slug}\x1b[0m\n`);
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

    // fallback to wizard
    const answers = await promptAgentWizard();
    const agentId = `${answers.agentName}@${getTimestamp()}`;
    const targetPath = path.resolve('.dokugent/data/agents', agentId, 'identity.json');
    await confirmAndWriteFile(targetPath, JSON.stringify(answers, null, 2));
    console.log(`✅  You can now continue with:\n    \x1b[34m"dokugent plan --agent ${agentId}"\x1b[0m\n`);
  })();
}
