import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

// options: { scope: string, protocol: string, steps: boolean }
export function runReview(options) {
  console.log('🛠 Running runReview with options:', options);
  const dokugentPath = path.join(process.cwd(), options.scope);
  const reviewPath = path.join(dokugentPath, 'review');

  fs.ensureDirSync(reviewPath);

  if (options.plan) {
    const planFile = path.join(dokugentPath, 'plan.yaml');
    if (fs.existsSync(planFile)) {
      const planContent = fs.readFileSync(planFile, 'utf-8');
      let planData;
      try {
        const docs = yaml.parseAllDocuments(planContent);
        planData = docs[0].toJSON();
      } catch (err) {
        console.error(`❌ Failed to parse plan.yaml: ${err.message}`);
        return;
      }

      if (!planData || !Array.isArray(planData.steps)) {
        console.log(`⚠️ 'steps' key not found or is not an array in plan.yaml`);
        return;
      }

      // Validate steps
      let hasError = false;
      const stepIds = new Set();

      planData.steps.forEach((step, index) => {
        const stepNum = index + 1;
        const requiredFields = ['id', 'description', 'use', 'input', 'output'];
        requiredFields.forEach(field => {
          if (!step[field]) {
            console.warn(`⚠️ Step ${stepNum} is missing required field: ${field}`);
            hasError = true;
          }
        });

        if (step.id) {
          if (stepIds.has(step.id)) {
            console.warn(`⚠️ Duplicate step id found: ${step.id}`);
            hasError = true;
          }
          stepIds.add(step.id);
        }
      });

      if (hasError) {
        console.warn('❌ Review halted due to step validation errors.');
        return;
      }

      const outputData = {
        reviewed_by: process.env.USER || 'unknown',
        reviewed_at: new Date().toISOString(),
        sha_signed: null,
        source_file: 'plan.yaml',
        steps: planData.steps
      };

      const frontmatter = `---\nreviewed_by: ${outputData.reviewed_by}\nreviewed_at: ${outputData.reviewed_at}\nsha_signed: null\nsource_file: ${outputData.source_file}\n---\n\n`;
      const fullContent = frontmatter + planContent;
      const reviewFile = path.join(reviewPath, 'review-plan.yaml');
      fs.writeFileSync(reviewFile, fullContent, 'utf-8');
      console.log(`✅ Plan review file written to: ${reviewFile}`);
    } else {
      console.log(`⚠️ Plan file not found at: ${planFile}`);
    }
    return;
  }

  let foldersToInclude = [];

  if (options.protocol === 'all' || options.protocols === 'all') {
    const protocolsDir = path.join(dokugentPath, 'protocols');
    if (fs.existsSync(protocolsDir)) {
      foldersToInclude = fs.readdirSync(protocolsDir)
        .filter((f) => fs.statSync(path.join(protocolsDir, f)).isDirectory())
        .map((f) => path.join('protocols', f));
    }
  } else {
    const protoInput = options.protocol || options.protocols;
    if (typeof protoInput === 'string') {
      foldersToInclude = protoInput.split(',').map((f) => path.join('protocols', f.trim()));
    }
    // Validate that each specified protocol folder exists before inclusion
    foldersToInclude = foldersToInclude.filter((folder) => {
      const fullPath = path.join(dokugentPath, folder);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Protocol folder not found: ${folder}`);
        return false;
      }
      return true;
    });
  }

  if (foldersToInclude.length === 0) {
    console.log('⚠️ No valid protocols found to include.');
    return;
  }

  const timestamp = new Date().toISOString();
  const frontmatter = `---\nreviewed_by: ${process.env.USER || 'unknown'}\nreviewed_at: ${timestamp}\nsha_signed: null\n---\n`;

  const contentLines = [frontmatter, `# Review – Protocols`, ''];

  foldersToInclude.forEach((folder) => {
    const folderPath = path.join(dokugentPath, folder);
    if (!fs.existsSync(folderPath)) return;

    const files = fs.readdirSync(folderPath).filter((file) => {
      const ext = path.extname(file);
      return ['.md', '.txt'].includes(ext);
    });

    if (files.length === 0) {
      console.warn(`⚠️ Protocol "${folder}" has no .md or .txt files. Skipping.`);
      return;
    }

    contentLines.push(`## ${folder}`);
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile()) {
        const data = fs.readFileSync(filePath, 'utf-8');
        if (!data.includes('#')) {
          console.warn(`⚠️ File "${file}" in "${folder}" may be unstructured (no headings found).`);
        }
        if (data.trim().length < 20) {
          console.warn(`⚠️ File "${file}" in "${folder}" may be too short to be useful.`);
        }
        contentLines.push(`### ${file}\n\n${data.trim()}`);
      }
    });
  });

  const fullContent = contentLines.join('\n\n');
  const reviewFile = path.join(reviewPath, 'review-protocols.md');
  fs.writeFileSync(reviewFile, fullContent, 'utf-8');

  console.log(`✅ Review file written to: ${reviewFile}`);
}
