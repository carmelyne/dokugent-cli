

/**
 * Handles the setup and management of convention files for different agent types.
 * Copies template conventions into the .dokugent project folder.
 * Supports backup and overwrite via --force flag.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveVersionedPath } from '../utils/resolveVersionedPath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copies convention template files into the .dokugent/conventions directory.
 * If the target directory exists and --force is provided, backs it up before overwriting.
 *
 * @param {Object} options
 * @param {string} options.type - The convention type (e.g., 'dev').
 * @param {boolean} [options.force=false] - Whether to force overwrite existing conventions.
 */
export async function handleConventions({ type, force = false }) {
  if (!type) {
    console.error("❌ Missing required argument <type>. Expected one of: 'dev', 'writing', 'research'. See docs for more info.");
    return;
  }
  const baseTemplatePath = path.join(__dirname, '../../presets/templates/conventions');
  const templatePath = resolveVersionedPath(baseTemplatePath, type);
  const targetBase = path.join(process.cwd(), '.dokugent/conventions');
  const targetPath = path.join(targetBase, type);

  if (await fs.pathExists(targetPath)) {
    if (!force) {
      console.log(`⚠️  .dokugent/conventions/${type} already exists. Use --force to overwrite.`);
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(targetBase, `${type}-${timestamp}`);
    await fs.move(targetPath, backupPath);
    console.log(`📦 Backed up existing ${type} conventions to ${backupPath}`);
  }

  await fs.copy(templatePath, targetPath);
  console.log(`✅ Copied ${type} conventions to .dokugent/conventions/${type}`);
}