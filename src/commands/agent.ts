import { promptAgentWizard } from '../utils/wizards/agent-wizard';
import { confirmAndWriteFile } from '../utils/fs-utils';
const path = require('path');
const { getTimestamp } = require('../utils/timestamp');

export function runAgentCommand() {
  (async () => {
    const answers = await promptAgentWizard();
    const agentId = `${answers.agentName}@${getTimestamp()}`;
    const targetPath = path.resolve('.dokugent/data/agents', agentId, 'identity.json');
    await confirmAndWriteFile(targetPath, JSON.stringify(answers, null, 2));
    console.log(`✅  You can now continue with:\n    \x1b[34m"dokugent plan --agent ${agentId}"\x1b[0m\n`);
  })();
}
