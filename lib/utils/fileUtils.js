import fs from 'fs-extra';
import path from 'path';

export function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
}

export function writeFileWithBackup(filePath, content, backup = false) {
  if (backup && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`);
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function ensureFolder(folderPath) {
  fs.ensureDirSync(path.resolve(folderPath));
}
