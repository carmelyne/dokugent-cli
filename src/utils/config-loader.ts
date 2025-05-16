/**
 * @file config-loader.ts
 * @description Loads configuration files for LLM overrides and agent registry metadata.
 * Supports YAML-based overrides for token settings and optional file exclusions.
 */
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Loads LLM runtime override settings from `.dokugent/overrides/llm-load.yaml`.
 * Falls back to defaults if the file is missing or unreadable.
 *
 * @returns {object} An object containing tokenLimit, warnIfExceeds, and excludeFiles.
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
 * Loads metadata for registered agents from `.dokugent/agent.yaml`.
 * Returns a dictionary of agent configurations, or an empty object if none exist.
 *
 * @returns {Record<string, unknown>} A map of agent names to their config objects.
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