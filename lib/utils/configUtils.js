import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

export function loadLLMLoadConfig() {
  const configPath = path.resolve('.dokugent/llm-load.yml');
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
    console.warn('⚠️ Could not read llm-load.yml, using defaults.');
    return defaultConfig;
  }
}

export function loadAgentYml() {
  const configPath = path.resolve('.dokugent/agent.yml');
  const defaultAgents = {};

  if (!fs.existsSync(configPath)) return defaultAgents;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw);
    return parsed?.agents || defaultAgents;
  } catch (err) {
    console.warn('⚠️ Could not read agent.yml');
    return defaultAgents;
  }
}
