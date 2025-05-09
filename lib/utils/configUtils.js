import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

export function loadLLMLoadConfig() {
  const configPath = path.resolve('.dokugent/llm-load.yaml');
  const defaultConfig = {
    tokenLimit: 6000,
    warnIfExceeds: true,
    excludeFiles: [],
  };

  if (!fs.existsSync(configPath)) return defaultConfig;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw);
    return { ...defaultConfig, ...parsed };
  } catch (err) {
    console.warn('⚠️ Could not read llm-load.yaml, using defaults.');
    return defaultConfig;
  }
}

export function loadAgentYml() {
  const configPath = path.resolve('.dokugent/agent.yaml');
  const defaultAgents = {};

  if (!fs.existsSync(configPath)) return defaultAgents;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw);
    return parsed?.agents || defaultAgents;
  } catch (err) {
    console.warn('⚠️ Could not read agent.yaml');
    return defaultAgents;
  }
}
