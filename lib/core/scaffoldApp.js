import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { folderGroups } from '../config/scaffold-groups.js';
import { expectedDefaultFiles } from '../config/expected-files.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scaffoldTemplates(scope, options) {
  const skippedFiles = [];
  const rootPath = path.resolve('.dokugent');
  const templateBase = path.resolve(__dirname, '../../presets/templates');
  const folders = folderGroups[scope];


  if (!folders) {
    console.error(`❌ Unknown scope: ${scope}`);
    return;
  }

  Object.entries(folders).forEach(([folder, files]) => {
    const fullPath = path.join(rootPath, folder);
    fs.ensureDirSync(fullPath);

    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      const templatePath = path.join(templateBase, path.basename(folder), file);

      if (fs.existsSync(templatePath)) {
        const shouldWrite = options.force || !fs.existsSync(filePath);

        if (!shouldWrite) {
          skippedFiles.push(`${folder}/${file}`);
          return;
        }

        if (fs.existsSync(filePath) && options.backup) {
          fs.copyFileSync(filePath, `${filePath}.bak`);
          console.log(`📦 Backup created: ${folder}/${file}.bak`);
        }

        const content = fs.readFileSync(templatePath, 'utf-8');
        fs.writeFileSync(filePath, content);
        console.log(`📋 Created from template: ${folder}/${file}`);
      } else {
        fs.writeFileSync(filePath, '');
        console.log(`📄 Created empty: ${folder}/${file}`);
      }
    });
  });

  expectedDefaultFiles.forEach(templateRelPath => {
    const src = path.resolve(templateBase, templateRelPath);
    const relativeDest = templateRelPath.startsWith('protocols/')
      ? path.join('protocols', templateRelPath.replace(/^protocols\//, ''))
      : templateRelPath;
    const dest = path.resolve(rootPath, relativeDest);
    fs.ensureDirSync(path.dirname(dest));

    if (!fs.existsSync(src)) {
      console.warn(`❗ Missing template: ${src}`);
      return;
    }

    if (fs.existsSync(dest)) {
      if (options.backup) {
        fs.copyFileSync(dest, `${dest}.bak`);
        console.log(`📦 Backup created: ${relativeDest}.bak`);
      }

      if (!options.force) {
        skippedFiles.push(relativeDest);
        return;
      }
    }

    fs.copyFileSync(src, dest);
    console.log(`📋 Copied default file: ${relativeDest}`);
  });

  // Copy .gitignore from template if present
  const gitignoreSrc = path.join(templateBase, '.gitignore');
  const gitignoreDest = path.join(rootPath, '.gitignore');
  if (fs.existsSync(gitignoreSrc)) {
    fs.copyFileSync(gitignoreSrc, gitignoreDest);
    console.log('📋 Copied template: .gitignore');
  }

  if (skippedFiles.length > 0) {
    if (skippedFiles.length > 3) {
      console.warn(`⚠️ Some files were skipped because they already exist.`);
      console.info(`ℹ️ Use --force to overwrite or --force --backup to preserve old versions.`);
    } else {
      skippedFiles.forEach(f =>
        console.warn(`⚠️ Skipped: ${f} already exists. Use --force to overwrite.`)
      );
    }
  }
  // Create default llm-load.yml if it doesn't exist
  const llmLoadPath = path.join(rootPath, 'llm-load.yml');
  if (!fs.existsSync(llmLoadPath)) {
    const defaultYaml = expectedDefaultFiles.map(templateRelPath =>
      templateRelPath.replace(/^presets\/templates\//, '')
    );
    const yamlContent = yaml.dump(defaultYaml);
    fs.writeFileSync(llmLoadPath, yamlContent, 'utf-8');
    console.log('📄 Generated default llm-load.yml');
  }
  // Create default agent.yml if it doesn't exist
  const agentSpecPath = path.join(rootPath, 'agent.yml');
  if (!fs.existsSync(agentSpecPath)) {
    const defaultAgentYaml = {
      codex: {
        notes: 'Optimized for code generation and CLI reasoning',
        tokenLimit: 6000
      },
      claude: {
        notes: 'Structured context agent, good for hierarchical prompts',
        tokenLimit: 9000
      }
    };
    const agentContent = yaml.dump(defaultAgentYaml);
    fs.writeFileSync(agentSpecPath, agentContent, 'utf-8');
    console.log('📄 Generated default agent.yml');
  }
  console.log(`✅ .dokugent folder scaffolded with scope: ${scope}`);
}


function scaffoldApp(scope = 'core', options = {}) {
  // Updated logic: --custom must be used with --blueprint
  if (options.custom) {
    if (!options.blueprint) {
      console.error('❌ The --custom flag must be used with --blueprint.');
      return;
    }

    const blueprintPath = path.resolve(__dirname, '../blueprints/blueprints.json');
    if (!fs.existsSync(blueprintPath)) {
      console.error(`❌ Blueprint file not found at ${blueprintPath}`);
      return;
    }

    const blueprints = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    const blueprint = blueprints[options.blueprint];

    if (!blueprint) {
      console.error(`❌ Unknown blueprint: ${options.blueprint}`);
      return;
    }

    const customPath = path.resolve('.dokugent', options.custom);
    if (fs.existsSync(customPath)) {
      console.warn(`⚠️ Folder .dokugent/${options.custom}/ already exists. Skipping scaffold.`);
      return;
    }

    blueprint.structure.forEach(filePath => {
      const fullPath = path.resolve(customPath, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, '');
      console.log(`📄 Created from blueprint: ${filePath}`);
    });

    console.log(`✅ Blueprint '${options.blueprint}' scaffolded under .dokugent/${options.custom}/`);
    return;
  }

  if (options.blueprint) {
    const blueprintPath = path.resolve(__dirname, '../blueprints/blueprints.json');
    if (!fs.existsSync(blueprintPath)) {
      console.error(`❌ Blueprint file not found at ${blueprintPath}`);
      return;
    }

    const blueprints = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    const blueprint = blueprints[options.blueprint];

    if (!blueprint) {
      console.error(`❌ Unknown blueprint: ${options.blueprint}`);
      return;
    }

    const rootPath = path.resolve('.dokugent', scope);
    blueprint.structure.forEach(filePath => {
      const fullPath = path.resolve(rootPath, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, '');
      console.log(`📄 Created from blueprint: ${filePath}`);
    });

    console.log(`✅ Blueprint '${options.blueprint}' scaffolded under .dokugent/${scope}/`);
    return;
  }

  console.log('🔧 Starting scaffoldTemplates...');
  scaffoldTemplates(scope, options);
  console.log('✅ Finished scaffoldTemplates.');
}

export { scaffoldApp };
