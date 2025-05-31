import { exec } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

exec('ts-node src/commands/init.ts --yes', (err, stdout, stderr) => {
  if (err) {
    console.error('❌ dokugent init --yes failed:\n', stderr);
    process.exit(1);
  }

  const basePath = path.resolve('.dokugent');
  const agentPath = path.join(basePath, 'agent-info/agents/agent-spec/init/default-agent');
  const specMd = path.join(agentPath, 'agent-spec.md');
  const specJson = path.join(agentPath, 'agent-spec.json');
  const toolList = path.join(agentPath, 'tool-list.md');
  const readme = path.join(basePath, 'README.md');

  const allExist = [specMd, specJson, toolList, readme].every(existsSync);

  if (!allExist) {
    console.error('❌ Required files missing after init.');
    console.error({
      specMd: existsSync(specMd),
      specJson: existsSync(specJson),
      toolList: existsSync(toolList),
      readme: existsSync(readme)
    });
    process.exit(1);
  }

  console.log('\n✅ dokugent init --yes test passed.\n');
});