const fs = require('fs-extra');
const path = require('path');

const folderGroups = {
  core: {
    'ux': ['flows.md', 'personas.md'],
    'db-schema': ['models.md', 'relationships.md', 'seed-data.md', 'migrations.md'],
    'mvc': ['controllers.md', 'models.md', 'views.md'],
    'design-system': ['tokens.md', 'components.md'],
    'changelog': ['v0.1.md']
  },
  addons: {
    'security': ['auth.md'],
    'testing': ['unit.md', 'manual.md'],
    'qa': ['checklist.md', 'edge-cases.md'],
    'devops': ['setup.md', 'deploy.md', 'dependency-policy.md', 'dependency-log.md'],
    'tech-seo': ['meta.md', 'sitemap.md'],
    'marketing': ['launch-checklist.md']
  }
};

function scaffoldApp(scope = 'core', options = {}) {
  const force = options.force || false;
  const backup = options.backup || false;
  const basePath = path.resolve('.docugent');
  let foldersToCreate = {};

  if (folderGroups[scope]) {
    foldersToCreate = folderGroups[scope];
  } else {
    // Assume individual folder scope
    foldersToCreate = Object.fromEntries(
      Object.entries({ ...folderGroups.core, ...folderGroups.addons, ...folderGroups.changelog })
        .filter(([key]) => key === scope)
    );
  }

  Object.entries(foldersToCreate).forEach(([folder, files]) => {
    const folderPath = path.join(basePath, folder);
    fs.ensureDirSync(folderPath);

    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      const relativePath = path.relative(basePath, filePath);

      if (fs.existsSync(filePath)) {
        if (!force) {
          console.warn(`⚠️  Skipped: ${relativePath}`);
          console.log(`    (Use --force  or --force --backup)`);
          return;
        }

        if (backup) {
          const backupPath = `${filePath}.bak`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`📦 Backup: ${relativePath} → ${path.basename(backupPath)}`);
        }
      }

      fs.outputFileSync(filePath, '');
    });

  });

  // Copy base templates
  const templateFiles = ['README.md', 'agent-instructions.md'];
  const optionalScopedFiles = {
    'devops': ['dependency-policy.md']
  };

  templateFiles.forEach(file => {
    const src = path.join(__dirname, '../presets/templates', file);
    const dest = path.join(basePath, file);
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest) && !force) {
        console.warn(`⚠️  Skipped: ${dest} already exists. Use --force or --force --backup.`);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  });

  if (optionalScopedFiles[scope]) {
    optionalScopedFiles[scope].forEach(file => {
      const src = path.join(__dirname, '../presets/templates', scope, file);
      const dest = path.join(basePath, scope, file);
      if (fs.existsSync(src)) {
        fs.ensureDirSync(path.join(basePath, scope));
        if (fs.existsSync(dest) && !force) {
          console.warn(`⚠️  Skipped: ${dest} already exists. Use --force or --force --backup.`);
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    });
  }

  console.log(`✅ .docugent folder scaffolded with scope: ${scope}`);
}

module.exports = { scaffoldApp };
