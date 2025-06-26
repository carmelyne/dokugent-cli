#!/usr/bin/env ts-node

/**
 * Entry point for the Dokugent CLI.
 * Handles command routing for agent workflows like init, plan, and more.
 */

/**
 * Copyright (c) 2024–2025 Carmelyne Thompson
 *
 * This software is licensed under the PolyForm Shield License 1.0.0.
 * You may obtain a copy of the License at
 * https://polyformproject.org/licenses/shield/1.0.0
 *
 * This license allows for noncommercial use only, subject to the terms and
 * conditions of the license. Commercial use requires separate permission.
 *
 * ✅ You may use this for personal projects, internal tools, or client work.
 * ❌ You may not use it to build or offer a competing product or service.
 *
 * See the full license for details:
 * https://polyformproject.org/licenses/shield/1.0.0
 */

import { paddedLog, paddedSub } from '@utils/cli/ui';

import { runAgentCommand } from '@src/commands/agent';
import { runByoCommand } from '@src/commands/byo';
import { runCertifyCommand } from '@src/commands/certify';
import { runComplianceCommand } from '@src/commands/compliance';
import { runCompileCommand } from '@src/commands/compile';
import { runConventionsCommand } from '@src/commands/conventions';
import { runCriteriaCommand } from '@src/commands/criteria';
import { runDeployCommand } from '@src/commands/deploy';
import { runDryrunCommand } from '@src/commands/dryrun';
import { runInitCommand } from '@src/commands/init'; // this will fail if init is empty
import { runInspectCommand } from '@src/commands/inspect';
import { runKeygenCommand } from '@src/commands/keygen';
import { runOwnerCommand } from '@src/commands/owner';
import { runPlanCommand } from '@src/commands/plan';
import { runPreviewCommand } from '@src/commands/preview';
import { runSecurity } from '@src/commands/security';
import { runSimulateCommand } from '@src/commands/simulate';
import { runSimulateViaEthica } from '@utils/simulate-runner';
import { runTraceCommand } from '@src/commands/trace';
// import { runUiCommand } from '@src/commands/ui';
// import { runRedteamCommand } from '../src/commands/redteam';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'agent':
    runAgentCommand?.();
    break;
  case 'byo':
    runByoCommand?.();
    break;
  case 'certify':
    runCertifyCommand?.();
    break;
  case 'compliance': {
    const agentArg = args[1];
    runComplianceCommand(agentArg);
    break;
  }
  case 'compile':
    runCompileCommand?.();
    break;
  case 'conventions':
    runConventionsCommand?.(args.slice(1));
    break;
  case 'criteria':
    runCriteriaCommand?.(args.slice(1));
    break;
  case 'deploy':
    runDeployCommand?.(args.slice(1));
    break;
  case 'dryrun':
    runDryrunCommand?.();
    break;
  case 'ethica':
    import('@src/commands/ethica').then(({ runEthicaCommand }) => {
      runEthicaCommand?.();
    });
    break;
  case 'init':
    runInitCommand?.();
    break;
  case 'inspect':
    runInspectCommand?.();
    break;
  case 'keygen':
    runKeygenCommand?.(process.argv.slice(2));
    break;
  case 'owner':
    runOwnerCommand?.();
    break;
  case 'plan':
    runPlanCommand?.(args.slice(1));
    break;
  case 'preview':
    runPreviewCommand?.();
    break;
  case 'security':
    runSecurity?.();
    break;
  case 'simulate':
    runSimulateCommand?.({ llm: undefined, configPath: undefined, human: "[No human input provided]" }, { debateOnly: false });
    break;
  case 'trace':
    runTraceCommand?.(args.slice(1));
    break;
  case 'ui-demo': {
    // runUiCommand?.(args.slice(1));
    require('../src/commands/ui-demo').default?.();
    break;
  }
  case 'memory':
    require('../src/commands/memory');
    break;
  // case 'redteam':
  //   runRedteamCommand();
  //   break;
  default: {
    paddedLog("Dokugent CLI is ready", " ");
    paddedLog('dokugent <command> [flags]', '', 12, 'magenta', 'USAGE');

    paddedLog('Available commands', '', 12, 'blue', 'COMMANDS');

    paddedSub("setup", [
      "• init        → Scaffold a new project",
      "• owner       → Set or view project owner metadata",
      "• agent       → Create a new agent identity (--t for template)",
      "• keygen      → Create identity keypairs"
    ].join("\n"));

    paddedSub("authoring", [
      "• plan        → Draft an agent plan",
      "• criteria    → Define evaluation criteria",
      "• conventions → Select AI conventions",
      "• byo         → Import external agent JSON payload",
      "• compliance  → Fill in GDPR & governance metadata",
      "• io          → Fill in I/O & Rules"
    ].join("\n"));

    paddedSub("ops", [
      "• preview     → Generate agent spec bundle",
      "• certify     → Sign and freeze validated preview",
      "• compile     → Build deployable agent bundle",
      "• deploy      → Run full deploy (preview → certify → compile)"
    ].join("\n"));

    paddedSub("debug", [
      "• dryrun      → Simulate plan execution without real actions",
      "• inspect     → Inspect agent cert or plan (local or MCP)",
      "• security    → Scan for file-level threats",
      "• simulate    → Run simulated agent logic with any LLM on your Ollama",
      "• trace       → Trace agent behavior from a dokuUri",
    ].join("\n"));

    paddedLog('See Examples below', '', 12, 'success', 'REFERENCE');
    paddedSub("Inspect local", "dokugent trace doku://happybot@2025-05-24_19-15-55-492");
    paddedSub("Trace remote", "dokugent inspect doku://mybot@2025-01-01 --show metadata");

    const input = command ?? '(none)';
    paddedLog(`Unknown command: ${input}`, '', 12, 'warn', 'INVALID');

    const knownCommands = [
      'agent', 'byo', 'certify', 'compliance', 'compile', 'conventions', 'criteria',
      'deploy', 'dryrun', 'init', 'inspect', 'keygen', 'owner', 'plan',
      'preview', 'security', 'simulate', 'trace', 'ui-demo', 'memory', 'redteam'
    ];
    const suggestion = knownCommands.find(cmd => cmd.startsWith(input));
    if (suggestion) paddedLog(`Did you mean '${suggestion}'?`, '', 12, 'info', 'HINT');
    break;
  }
}
