// Placeholder: Setup core directories
export const AGENT_DIR = '.dokugent/data/agents';
//.dokugent/data/agents/current or .dokugent/data/agents/latest,
// can get the correct agentID and @birthtimestamp from the symlink

export const CERT_DIR = '.dokugent/ops/certified'; // Folder for certified outputs
// Files inside follow pattern:
// .dokugent/ops/certified/<agentname>/agentname@birthtimestamp.cert.json
// .dokugent/ops/certified/<agentname>/agentname@birthtimestamp.cert.sha256

export const COMPILED_DIR = '.dokugent/ops/compiled'; // src/config/agentsConfig.ts

export const AGENTS_CONFIG_DIR = '.dokugent/config/agents'; // src/config/agentsConfig.ts

export const BYO_DIR = '.dokugent/data/byo'; // .dokugent/data/byo

export const LOG_DIR = '.dokugent/ops/logs/compiled'; // .dokugent/ops/logs/certified
export const REPORTS_DIR = '.dokugent/ops/reports/compiled'; // .dokugent/ops/logs/certified
