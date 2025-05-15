import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Load LLM override settings from `.dokugent/overrides/llm-load.yaml`.
 * Falls back to a built‑in default if the file is missing or unreadable.
 */
export function loadLLMOverrides(): {
  tokenLimit: number;
  warnIfExceeds: boolean;
  excludeFiles: string[];
} {
  const configPath = path.resolve('.dokugent/overrides/llm-load.yaml');
  const defaultConfig = {
    tokenLimit: 6000,
    warnIfExceeds: true,
    excludeFiles: [] as string[],
  };

  if (!fs.existsSync(configPath)) return defaultConfig;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw) as Record<string, unknown>;
    return { ...defaultConfig, ...(parsed ?? {}) };
  } catch (err) {
    console.warn('⚠️  Could not read overrides/llm-load.yaml — using defaults.');
    return defaultConfig;
  }
}

/**
 * Load registered agents metadata from `.dokugent/agent.yaml`.
 * Returns an object keyed by agent name, or an empty object if none found.
 */
export function loadRegisteredAgents(): Record<string, unknown> {
  const configPath = path.resolve('.dokugent/agent.yaml');
  if (!fs.existsSync(configPath)) return {};

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw) as { agents?: Record<string, unknown> };
    return parsed?.agents ?? {};
  } catch (err) {
    console.warn('⚠️  Could not read agent.yaml — returning empty agent list.');
    return {};
  }
}