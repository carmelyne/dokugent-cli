import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { folderGroups } from '../config/scaffold-groups.js';
import { expectedDefaultFiles } from '../config/expected-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scaffoldTemplates(scope, options) {
  const skippedFiles = [];
  const rootPath = path.resolve('.docugent');
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
      const templatePath = path.join(templateBase, folder, file);
      const shouldWrite = options.force || !fs.existsSync(filePath);

      if (!shouldWrite) {
        skippedFiles.push(`${folder}/${file}`);
        return;
      }

      if (fs.existsSync(filePath) && options.backup) {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      }

      if (options.withChecklists && fs.existsSync(templatePath)) {
        if (fs.existsSync(filePath)) {
          if (!options.force) {
            skippedFiles.push(`${folder}/${file}`);
            return;
          }

          if (options.backup) {
            fs.copyFileSync(filePath, `${filePath}.bak`);
            console.log(`📦 Backup created: ${folder}/${file}.bak`);
          }
        }

        const content = fs.readFileSync(templatePath, 'utf-8');
        fs.writeFileSync(filePath, content);
        console.log(`📋 Created from checklist: ${folder}/${file}`);
      } else {
        fs.writeFileSync(filePath, '');
        console.log(`📄 Created: ${folder}/${file}`);
      }
    });
  });

  expectedDefaultFiles.forEach(templateRelPath => {
    const src = path.resolve(templateBase, templateRelPath);
    const relativeDest = templateRelPath.replace(/^presets\/templates\//, '');
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
  console.log(`✅ .docugent folder scaffolded with scope: ${scope}`);
}


function scaffoldApp(scope = 'core', options = {}) {
  console.log('🔧 Starting scaffoldTemplates...');
  scaffoldTemplates(scope, options);
  console.log('✅ Finished scaffoldTemplates.');
}

export { scaffoldApp, compileBriefing };
function compileBriefing(llm, options = {}) {
  const rootPath = path.resolve('.docugent');
  const llmLoadPath = path.join(rootPath, 'llm-load.yml');
  const outputPath = path.join(rootPath, 'agent-briefings', `${llm}.md`);

  if (!fs.existsSync(llmLoadPath)) {
    console.warn(`❗ Missing llm-load.yml. Cannot compile agent briefing without file list.`);
    return;
  }

  const fileList = yaml.load(fs.readFileSync(llmLoadPath, 'utf-8'));

  if (!Array.isArray(fileList)) {
    console.warn(`❗ Invalid format in llm-load.yml. Expected an array of file paths.`);
    return;
  }

  const filesToCombine = fileList
    .map(relPath => path.resolve(rootPath, relPath))
    .filter(fs.existsSync);

  if (filesToCombine.length === 0) {
    console.warn(`❗ No valid files found to include in agent briefing.`);
    return;
  }

  const combined = filesToCombine
    .map(file => fs.readFileSync(file, 'utf-8').trim())
    .join('\n\n---\n\n');

  fs.ensureDirSync(path.dirname(outputPath));
  fs.writeFileSync(outputPath, combined);

  console.log(`🧠 Agent briefing compiled: agent-briefings/${llm}.md`);
  const tokenSize = combined.length / 4;
  console.log(`📊 Estimated token size: ~${Math.round(tokenSize)} tokens`);
}