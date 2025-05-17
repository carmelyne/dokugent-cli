#!/usr/bin/env ts-node

/**
 * Entry point for the Dokugent CLI.
 * Handles command routing for agent workflows like init, plan, and more.
 */

import { runInitCommand } from '../src/commands/init'; // this will fail if init is empty
import { runPlanCommand } from '../src/commands/plan';
import { runCriteria } from '../src/commands/criteria';
import { runConventions } from '../src/commands/conventions';
import { runSecurity } from '../src/commands/security';
import { runPreviewCommand } from '../src/commands/preview';
import { keygenCommand } from '../src/commands/keygen';
import { runCertifyCommand } from '../src/commands/certify';
import { runCompileCommand } from '../src/commands/compile';
import { runAgentCommand } from '../src/commands/agent';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    runInitCommand?.();
    break;
  case 'plan':
    runPlanCommand?.(args.slice(1));
    break;
  case 'criteria':
    runCriteria?.();
    break;
  case 'conventions':
    runConventions?.();
    break;
  case 'security':
    runSecurity?.();
    break;
  case 'preview':
    runPreviewCommand?.();
    break;
  case 'keygen':
    keygenCommand?.();
    break;
  case 'certify': {
    const agentArg = args[1] || 'default-agent';
    runCertifyCommand?.(agentArg);
    break;
  }
  case 'compile':
    runCompileCommand?.();
    break;
  case 'agent':
    runAgentCommand?.();
    break;
  default:
    console.log("\n🚀 Dokugent CLI is ready.");
    console.log("🧠 Usage: dokugent <command>\n");
    console.log("📜 Available commands:\n");
    console.log("   • init        → Scaffold a new project");
    console.log("   • plan        → Draft an agent plan");
    console.log("   • criteria    → Define evaluation criteria");
    console.log("   • conventions → Select AI conventions");
    console.log("   • security    → Scan for file-level threats");
    console.log("   • preview     → Generate agent spec bundle");
    console.log("   • certify     → Sign and freeze validated preview");
    console.log("   • compile     → Build deployable agent bundle");
    console.log("   • keygen      → Create identity keypairs");
    console.log("   • agent       → Create a new agent identity\n");
}