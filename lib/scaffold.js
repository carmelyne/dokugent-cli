const fs = require('fs-extra');
const path = require('path');

const folderGroups = {
  core: {
    'project.md': [],
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
      const templatePath = path.join(__dirname, `../presets/templates/${folder}/${file}`);

      const fileAlreadyExists = fs.existsSync(filePath);
      const templateExists = fs.existsSync(templatePath);

      if (fileAlreadyExists) {
        if (options.withChecklists && backup) {
          const backupPath = `${filePath}.bak`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`📦 Backup: ${relativePath} → ${path.basename(backupPath)}`);
          fs.copyFileSync(templatePath, filePath);
          console.log(`📋 Created from checklist: ${relativePath}`);
          return;
        }
        if (!force) {
          console.warn(`⚠️  Skipped: ${relativePath} (existing file — use --force, --force --backup, or --with-checklists --backup`);
          return;
        }

        if (backup) {
          const backupPath = `${filePath}.bak`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`📦 Backup: ${relativePath} → ${path.basename(backupPath)}`);
        }
      }

      if (options.withChecklists && templateExists) {
        // Prevent writing into the presets/templates directory
        if (templatePath.includes('/presets/templates')) {
          fs.copyFileSync(templatePath, filePath);
          console.log(`📋 Created from checklist: ${relativePath}`);
        } else {
          console.warn(`🚫 Unsafe write skipped: tried to write to template path ${templatePath}`);
        }
      } else {
        if (!templateExists && options.withChecklists) {
          console.warn(`❗ TEMPLATE NOT FOUND: ${templatePath}`);
        }
        fs.outputFileSync(filePath, `# ${file.replace('.md', '')}`);
        console.log(`📄 Created: ${relativePath} (blank starting point)`);
      }
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

  // Handle optional top-level files (e.g., devops/dependency-policy.md) with overwrite safety
  if (optionalScopedFiles[scope]) {
    optionalScopedFiles[scope].forEach(file => {
      const src = path.join(__dirname, '../presets/templates', scope, file);
      const dest = path.join(basePath, scope, file);
      if (fs.existsSync(src)) {
        fs.ensureDirSync(path.join(basePath, scope));
        if (fs.existsSync(dest) && !force) {
          console.warn(`⚠️  Skipped: ${dest} already exists. Use --force or --force --backup.`);
        } else {
          if (fs.existsSync(dest) && backup) {
            const backupPath = `${dest}.bak`;
            fs.copyFileSync(dest, backupPath);
            console.log(`📦 Backup: ${dest} → ${path.basename(backupPath)}`);
          }
          fs.copyFileSync(src, dest);
          console.log(`📋 Created optional: ${path.relative(basePath, dest)}`);
        }
      }
    });
  }

  // Reference: expected .docugent structure
  const expectedFiles = [
    'db-schema/models.md',
    'db-schema/relationships.md',
    'db-schema/seed-data.md',
    'db-schema/migrations.md',
    'mvc/controllers.md',
    'mvc/models.md',
    'mvc/views.md',
    'design-system/tokens.md',
    'design-system/components.md',
    'changelog/v0.1.md',
    'security/auth.md',
    'testing/unit.md',
    'testing/manual.md',
    'qa/checklist.md',
    'qa/edge-cases.md',
    'devops/setup.md',
    'devops/deploy.md',
    'devops/dependency-log.md',
    'tech-seo/meta.md',
    'tech-seo/sitemap.md',
    'ux/flows.md',
    'ux/personas.md',
    'marketing/launch-checklist.md'
  ];

  console.log(`✅ .docugent folder scaffolded with scope: ${scope}`);
}

module.exports = { scaffoldApp };
