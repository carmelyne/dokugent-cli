import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { folderGroups } from '../config/scaffold-groups.js';
import { expectedDefaultFiles } from '../config/expected-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scaffoldApp(scope = 'core', options = {}) {
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

      if (!shouldWrite) return;

      if (fs.existsSync(filePath) && options.backup) {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      }

      if (options.withChecklists && fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf-8');
        fs.writeFileSync(filePath, content);
        console.log(`📋 Created from checklist: ${folder}/${file}`);
      } else {
        fs.writeFileSync(filePath, '');
        console.log(`📄 Created: ${folder}/${file}`);
      }
    });
  });

  // Always write expected default files
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

      if (!options.force && !options.withChecklists) {
        console.warn(`⚠️ Skipped: ${relativeDest} already exists. Use --force or --backup.`);
        return;
      }
    }

    fs.copyFileSync(src, dest);
    console.log(`📋 Copied default file: ${relativeDest}`);
  });

  console.log(`✅ .docugent folder scaffolded with scope: ${scope}`);
}

export { scaffoldApp };