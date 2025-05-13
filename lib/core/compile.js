import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function countTokens(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

async function compile() {
  const baseDir = path.resolve('.dokugent/certified/latest/');
  const outputDir = path.join('.dokugent', 'structured');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(baseDir);
  const output = { meta: { compiledAt: new Date().toISOString(), source: 'latest', tokens: {} } };
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

  const timestamp = Date.now();
  const outputFilename = `${timestamp}-compiled.json`;
  const outputPath = path.join(outputDir, outputFilename);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  fs.chmodSync(outputPath, 0o444);

  console.log(`
✨ Compile Success ✨

📦  Output:         .dokugent/compiled/${outputFilename}
🧠  Total Tokens:   ${totalTokens}

🔒  Structured agent file is now ready for dryrun/simulate/trace!
`);
}

export { compile };
