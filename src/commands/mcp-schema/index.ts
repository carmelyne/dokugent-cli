import { Command, Option } from 'commander';
import fs from 'fs';
import path from 'path';
import { getAgentPlan, getAgentCriteria } from '../lib/agent-utils'; // Assume utility functions exist
import { MCPAgentSchema } from '../types/mcp';

const command = new Command('mcp-schema');

command
  .description('Generate an MCP-compliant schema from agent metadata')
  .requiredOption('-a, --agent <agentId>', 'Agent ID')
  .option('-o, --output <filepath>', 'Output file path')
  .action(async (options) => {
    const { agent, output } = options;
    const plan = await getAgentPlan(agent);
    const criteria = await getAgentCriteria(agent);

    const mcpSchema: MCPAgentSchema = {
      id: agent,
      goals: plan?.goals || [],
      tools: plan?.tools || [],
      memory: {
        type: 'unspecified',
        source: 'unspecified',
      },
      state: {
        currentTask: null,
        lastInteraction: null,
      },
    };

    const outPath = output || path.join('build', `${agent}.mcp.json`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(mcpSchema, null, 2), 'utf-8');

    console.log(`✅ MCP schema saved to ${outPath}`);
  });

export default command;
