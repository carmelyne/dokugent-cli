import fs from 'fs-extra';
import path from 'path';

// options: { scope: string, protocols: string }
export function stageReview(options) {
  console.log('🛠 Running stageReview with options:', options);
  const dokugentPath = path.join(process.cwd(), options.scope);
  const reviewPath = path.join(dokugentPath, 'staging');
  const reviewFile = path.join(reviewPath, 'review.md');

  fs.ensureDirSync(reviewPath);

  let foldersToInclude = [];

  if (options.protocols === 'all') {
    const protocolsDir = path.join(dokugentPath, 'protocols');
    if (fs.existsSync(protocolsDir)) {
      foldersToInclude = fs.readdirSync(protocolsDir)
        .filter((f) => fs.statSync(path.join(protocolsDir, f)).isDirectory())
        .map((f) => path.join('protocols', f));
    }
  } else if (typeof options.protocols === 'string') {
    foldersToInclude = options.protocols.split(',').map((f) => path.join('protocols', f.trim()));
  }

  const contentLines = [`# Review for ${options.scope}`, ''];

  foldersToInclude.forEach((folder) => {
    const folderPath = path.join(dokugentPath, folder);
    if (!fs.existsSync(folderPath)) return;

    contentLines.push(`## ${folder}`);
    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile()) {
        const data = fs.readFileSync(filePath, 'utf-8');
        contentLines.push(`### ${file}\n\n${data.trim()}\n`);
      }
    });
  });

  const timestamp = new Date().toISOString();
  const frontmatter = `---\nreviewed_by: ${process.env.USER || 'unknown'}\nreviewed_at: ${timestamp}\nsha_signed: null\n---\n`;

  contentLines.unshift(frontmatter);

  const fullContent = contentLines.join('\n\n');
  fs.writeFileSync(reviewFile, fullContent, 'utf-8');

  console.log(`✅ Staging review written to: ${reviewFile}`);
}
