import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export function loadSpecStructure() {
  const structurePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../config/structure.yaml');
  const structure = yaml.load(fs.readFileSync(structurePath, 'utf8'));

  const projectRoot = process.cwd();

  const load = (p) => fs.readFileSync(path.join(projectRoot, p), 'utf8');

  return {
    agentSpec: load(structure.agentSpec),
    criteria: load(structure.criteria),
    plan: load(structure.plan),
    config: structure.tools?.config ? load(structure.tools.config) : null,
    hooks: structure.tools?.hooks ? load(structure.tools.hooks) : null,
    list: structure.tools?.list ? load(structure.tools.list) : null,
    conventionsPath: structure.conventions,
    previewPath: structure.preview,
    certifiedPath: structure.certified,
    reportsPath: structure.reports,
  };
}