/**
 * @file doku-volt.ts
 * @description Central assembler for DOKU-form compiled.json metadata.
 *
 * Compiled Doku Volt metadata example:
 *
 * {
 *   "agent": "summarybot",            // CLI command: --agent
 *   "owner": "kinderbytes",           // CLI command: --owner
 *   "signer": "key-ed25519-01.pem",   // CLI command: --signer
 *   "mainTask": "Summarize input as 3 bullet points", // CLI command: --mainTask
 *   "version": "2025-05-17T10:12:04Z", // CLI command: --version
 *   "uri": "doku:agent/summarybot@2025-05-17.kinderbytes", // CLI command: compile --uri
 *   "tools": ["openai-chat", "markdown-cleaner"], // CLI command: --tools
 *   "planSteps": [
 *     "summarize_input",
 *     "reformat_output",
 *     "check_bullets"
 *   ], // CLI command: --planSteps
 *   "criteria": ["must have 3 bullets", "max 200 words"], // CLI command: --criteria
 *   "conventions": ["formal tone", "English only"], // CLI command: --conventions
 *   "description": "Assists with summarizing input text", // CLI command: --description
 *   "roles": ["summarizer", "formatter"], // CLI command: --roles
 *   "protocols": ["markdown", "text/plain"], // CLI command: --protocols
 *   "outputs": ["summary.md"], // CLI command: --outputs
 *   "understands": ["english", "markdown structure"], // CLI command: --understands
 *   "allowExternalFiles": true, // CLI command: --allowExternalFiles
 *   "requireApproval": false, // CLI command: --requireApproval
 *   "denylist": ["html", "javascript"] // CLI command: --denylist
 * }
 */

export interface DokuVolt {
  agent?: string;
  owner?: string;
  signer?: string;
  mainTask?: string;
  version?: string;
  uri?: string;
  tools?: string[];
  planSteps?: string[];
  criteria?: string[];
  conventions?: string[];
  allowance?: string;
}

export class DokuVoltAssembler {
  private volt: DokuVolt = {};

  setInit({ agent, owner, mainTask }: { agent: string; owner: string; mainTask: string }) {
    this.volt.agent = agent;
    this.volt.owner = owner;
    this.volt.mainTask = mainTask;
  }

  setTools(tools: string[]) {
    this.volt.tools = tools;
  }

  setPlanSteps(planSteps: string[]) {
    this.volt.planSteps = planSteps;
  }

  setCriteria(criteria: string[]) {
    this.volt.criteria = criteria;
  }

  setConventions(conventions: string[]) {
    this.volt.conventions = conventions;
  }

  setSigner(signer: string) {
    this.volt.signer = signer;
  }

  setVersion(version: string) {
    this.volt.version = version;
  }

  setURI(uri: string) {
    this.volt.uri = uri;
  }

  setAllowance(allowance: string) {
    this.volt.allowance = allowance;
  }

  getVolt(): DokuVolt {
    return this.volt;
  }
}