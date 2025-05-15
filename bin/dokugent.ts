#!/usr/bin/env ts-node

/**
 * Entry point for the Dokugent CLI.
 * Handles command routing for agent workflows like init, plan, and more.
 */

import { runInitCommand } from '../src/commands/init'; // this will fail if init is empty
import { runPlanCommand } from '../src/commands/plan';
import { runCriteria } from '../src/commands/criteria';
import { runConventions } from '../src/commands/conventions';

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
  default:
    console.log("🚀 Dokugent CLI is alive in TS!");
    console.log("Usage: dokugent <command>");
    console.log("Available commands: init, plan, criteria, conventions");
}