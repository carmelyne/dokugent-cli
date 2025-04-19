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
    'devops': ['setup.md', 'deploy.md'],
    'tech-seo': ['meta.md', 'sitemap.md'],
    'marketing': ['launch-checklist.md']
  }
};

function scaffoldApp(scope = 'core') {
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
      fs.outputFileSync(path.join(folderPath, file), '');
    });
  });

  // Copy templates
  fs.copyFileSync(path.join(__dirname, '../presets/templates/README.md'), path.join(basePath, 'README.md'));
  fs.copyFileSync(path.join(__dirname, '../presets/templates/agent-instructions.md'), path.join(basePath, 'agent-instructions.md'));

  console.log(`✅ .docugent folder scaffolded with scope: ${scope}`);
}

module.exports = { scaffoldApp };
