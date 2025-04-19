import { describe, it, beforeAll, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { scaffoldApp } from '../lib/scaffold.js';
import { folderGroups } from '../lib/scaffold-groups.js'; // 🔁 We'll extract this next

describe('docugent scaffold (core)', () => {
  const testDir = path.resolve('.docugent');

  // Flatten the folderGroups.core into a flat list of paths
  const expectedFiles = Object.entries(folderGroups.core).flatMap(([folder, files]) =>
    files.map(file => `${folder}/${file}`)
  );

  beforeAll(() => {
    fs.removeSync(testDir);
    scaffoldApp('core');
  });

  expectedFiles.forEach(relativePath => {
    it(`should create .docugent/${relativePath}`, () => {
      const fullPath = path.join(testDir, ...relativePath.split('/'));
      const exists = fs.existsSync(fullPath);

      // Log the actual file existence check
      console.log(`[test] Checked: .docugent/${relativePath} — ${exists ? '✅ Found' : '❌ Missing'}`);

      expect(exists).toBe(true);
    });
  });

});