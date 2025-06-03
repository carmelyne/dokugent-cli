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

import { runAgentCommand } from '@src/commands/agent';
import { runByoCommand } from '@src/commands/byo';
import { runCertifyCommand } from '@src/commands/certify';
import { runComplianceWizard } from '@src/commands/compliance';
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
import { runTraceCommand } from '@src/commands/trace';

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
    if (!agentArg) {
      console.error('\n❌ Missing required agent ID.\nUsage: dokugent compliance <agentId>\n');
      process.exit(1);
    }
    runComplianceWizard(agentArg);
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
    runSimulateCommand?.();
    break;
  case 'trace':
    runTraceCommand?.(args.slice(1));
    break;
  default:
    console.log("\n🚀 Dokugent CLI is ready.");
    console.log("\n🧠 Usage: dokugent <command>\n");
    console.log("📜 Available commands:\n");
    console.log("   \x1b[34m• init\x1b[0m        → Scaffold a new project");
    console.log("   \x1b[34m• agent\x1b[0m       → Create a new agent identity (use --t for a template)");
    console.log("   \x1b[34m• plan\x1b[0m        → Draft an agent plan");
    console.log("   \x1b[34m• criteria\x1b[0m    → Define evaluation criteria");
    console.log("   \x1b[34m• conventions\x1b[0m → Select AI conventions");
    console.log("   \x1b[34m• byo\x1b[0m         → Import and validate external BYO metadata");
    console.log("   \x1b[34m• compliance\x1b[0m  → Fill in GDPR and governance metadata");
    console.log("   \x1b[34m• deploy\x1b[0m      → Run full deploy: preview → certify → compile");
    console.log("   \x1b[34m• io\x1b[0m          → Fill in I/O & Rules");
    console.log("   \x1b[34m• inspect\x1b[0m     → Inspect agent certificate or plan (local or MCP)");
    console.log("   \x1b[34m• security\x1b[0m    → Scan for file-level threats");
    console.log("   \x1b[34m• preview\x1b[0m     → Generate agent spec bundle");
    console.log("   \x1b[34m• certify\x1b[0m     → Sign and freeze validated preview");
    console.log("   \x1b[34m• compile\x1b[0m     → Build deployable agent bundle");
    console.log("   \x1b[34m• keygen\x1b[0m      → Create identity keypairs");
    console.log("   \x1b[34m• owner\x1b[0m       → Set or view project owner metadata");
    console.log("   \x1b[34m• dryrun\x1b[0m      → Simulate plan execution without real actions");
    console.log("   \x1b[34m• simulate\x1b[0m    → Run simulated agent logic with Mistral + Ollama");
    console.log("   \x1b[34m• trace\x1b[0m       → Trace an agent's behavior from a dokuUri");
    console.log("\n");
}
