import { describe, it, beforeAll, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { scaffoldApp } from '../lib/scaffold.js';
import { folderGroups } from '../lib/scaffold-groups.js'; // 🔁 We'll extract this next

describe('docugent scaffold (core)', () => {
  const testDir = path.resolve('.docugent');

  // Flatten the folderGroups.core into a flat list of scaffolded paths
  const expectedFiles = [
    'ux/flows.md',
    'ux/personas.md',
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
  ];

  beforeAll(() => {
    fs.removeSync(testDir);
    scaffoldApp('core', { withChecklists: true });
  });

  expectedFiles.forEach(relativePath => {
    it(`should create .docugent/${relativePath}`, () => {
      const fullPath = path.join(testDir, relativePath);
      const exists = fs.existsSync(fullPath);

      // Log the actual file existence check
      console.log(`[test] Checked: .docugent/${relativePath} — ${exists ? '✅ Found' : '❌ Missing'}`);

      expect(exists).toBe(true);
    });
  });

});