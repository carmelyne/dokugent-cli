import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import deepmerge from 'deepmerge/dist/cjs.js'; // or try .mjs or .js depending on version

const AGENT_DIRS = ['agent', 'agent-tools', 'conventions', 'criteria', 'keys', 'plan', 'certified'];
const BASE_DIR = path.resolve(process.cwd(), '.dokugent');
const OUTPUT_DIR = path.resolve(process.cwd(), 'structured');

function readFilesRecursively(dir, exts) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(readFilesRecursively(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function deduplicateMarkdown(mdStrings) {
  const seen = new Set();
  const deduped = [];
  for (const md of mdStrings) {
    if (!seen.has(md)) {
      deduped.push(md);
      seen.add(md);
    }
  }
  return deduped.join('\n\n');
}

export function compile() {
  const certifiedDir = path.resolve(process.cwd(), 'certified');
  if (!fs.existsSync(certifiedDir)) {
    throw new Error(`Certified directory does not exist: ${certifiedDir}`);
  }
  const subdirs = fs.readdirSync(certifiedDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (subdirs.length === 0) {
    throw new Error(`No subdirectories found in certified directory: ${certifiedDir}`);
  }

  // Sort subdirectories by timestamp (assuming folder names are timestamps or sortable)
  subdirs.sort((a, b) => {
    const aTime = Date.parse(a) || 0;
    const bTime = Date.parse(b) || 0;
    return bTime - aTime;
  });

  const latestFolder = subdirs[0];
  const sourceDir = path.join(certifiedDir, latestFolder);

  const mdFiles = [];
  const yamlFiles = [];
  const jsonFiles = [];
  const sourceFiles = [];

  const files = readFilesRecursively(sourceDir, ['.md', '.yaml', '.yml', '.json']);
  for (const file of files) {
    sourceFiles.push(file);
    const ext = path.extname(file).toLowerCase();
    const filename = path.basename(file);
    if ((ext === '.md' || ext === '.yaml' || ext === '.yml') && filename.includes('cert.')) {
      if (ext === '.md') {
        mdFiles.push(file);
      } else {
        yamlFiles.push(file);
      }
    } else if (ext === '.json') {
      jsonFiles.push(file);
    }
  }

  // Read and deep-merge json files
  let json = {};
  for (const f of jsonFiles) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const parsed = JSON.parse(content);
      json = deepmerge(json, parsed);
    } catch (e) {
      console.error(`Failed to parse JSON file ${f}:`, e);
    }
  }

  // Prepare compiled object fields to be filled by matched files
  const compiled = {};

  // Helper function to read file content as string
  function readFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  // Process markdown and yaml files to assign contents to keys based on base filename (without extension)
  for (const file of [...mdFiles, ...yamlFiles]) {
    const filename = path.basename(file);
    const ext = path.extname(filename).toLowerCase();
    const baseName = filename.slice(0, filename.lastIndexOf(ext));
    compiled[baseName] = readFileContent(file);
  }

  compiled.rawJson = JSON.stringify(json, null, 2);
  compiled.meta = {
    generatedAt: new Date().toISOString(),
    sourceFiles,
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const OUTPUT_FILE = path.join(OUTPUT_DIR, `${latestFolder}-compiled.json`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compiled, null, 2), 'utf8');
  fs.chmodSync(OUTPUT_FILE, 0o444); // read-only

  return compiled;
}
