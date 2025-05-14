import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function countTokens(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

async function compile() {
  const baseDir = path.resolve('.dokugent/certified/latest/');
  const realPath = fs.realpathSync(baseDir);
  const certifiedFolderName = path.basename(realPath);
  const outputDir = path.join('.dokugent', 'structured');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(baseDir);
  const output = { meta: { compiledAt: new Date().toISOString(), source: certifiedFolderName, tokens: {} } };
  let totalTokens = 0;

  files.forEach(file => {
    if (file.endsWith('.sha256') || file.endsWith('.certification.md')) {
      return;
    }
    if (file.endsWith('.cert.md') || file.endsWith('.cert.yaml')) {
      const filePath = path.join(baseDir, file);
      const filenameKey = path.basename(file, path.extname(file));
      let content;
      if (file.endsWith('.cert.md')) {
        content = fs.readFileSync(filePath, 'utf8');
        output[filenameKey] = content;
        const tokens = countTokens(content);
        output.meta.tokens[filenameKey] = tokens;
        totalTokens += tokens;
      } else if (file.endsWith('.cert.yaml')) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        content = yaml.load(fileContent);
        output[filenameKey] = content;
        const tokens = countTokens(fileContent);
        output.meta.tokens[filenameKey] = tokens;
        totalTokens += tokens;
      }
    }
  });

  // Create structured folder for this compile
  const structuredFolder = path.join(outputDir, `${certifiedFolderName}-compiled`);
  fs.mkdirSync(structuredFolder, { recursive: true });

  const outputFilename = `${certifiedFolderName}-compiled.json`;
  const outputPath = path.join(structuredFolder, outputFilename);
  if (fs.existsSync(outputPath)) {
    fs.chmodSync(outputPath, 0o666); // make writable
    fs.unlinkSync(outputPath);      // delete existing file
  }
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  fs.chmodSync(outputPath, 0o444);

  // Generate SHA file
  const crypto = await import('crypto');
  const sha256 = crypto.createHash('sha256').update(JSON.stringify(output, null, 2)).digest('hex');
  fs.writeFileSync(path.join(structuredFolder, 'structured.sha256'), sha256);

  // Create latest symlink
  const latestSymlink = path.join(outputDir, 'latest');
  try {
    if (fs.existsSync(latestSymlink) || fs.lstatSync(latestSymlink).isSymbolicLink()) {
      fs.unlinkSync(latestSymlink);
    }
  } catch { }

  fs.symlinkSync(path.relative(outputDir, structuredFolder), latestSymlink, 'dir');

  console.log(`
✨ Compile Success ✨

📦  Output:         .dokugent/structured/${certifiedFolderName}-compiled/${outputFilename}
🧠  Total Tokens:   ${totalTokens}

🔒  Structured agent file is now ready for dryrun/simulate/trace!
`);
}

export { compile };
