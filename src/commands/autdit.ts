

import fs from 'fs-extra';
import path from 'path';

export async function runAuditCommand() {
  const compiledPath = path.join(process.cwd(), '.dokugent', 'compiled', 'compiled.json');
  const auditPath = path.join(process.cwd(), '.dokugent', 'audit');
  const tracePath = path.join(auditPath, 'iso-trace.md');

  if (!(await fs.pathExists(compiledPath))) {
    console.error('❌ compiled.json not found. Run `dokugent compile` first.');
    return;
  }

  const data = await fs.readJson(compiledPath);
  await fs.ensureDir(auditPath);

  const content = `# ISO 9001:2015 Trace Log — Agent Audit

## 📄 Agent Metadata
- **Agent Name:** ${data.agent}
- **Owner:** ${data.owner}
- **Signer:** ${data.signer}
- **Version:** ${data.version}
- **URI:** ${data.uri}
- **Main Task:** ${data.mainTask}

## 🔧 Tools
${(data.tools || []).map((t: string) => `- ${t}`).join('\n')}

## 🧩 Plan Steps
${(data.planSteps || []).map((p: string) => `- ${p}`).join('\n')}

## ✅ Criteria
${(data.criteria || []).map((c: string) => `- ${c}`).join('\n')}

## 📏 Conventions
${(data.conventions || []).map((c: string) => `- ${c}`).join('\n')}

---

✔️ This agent bundle was generated via \`dokugent compile\` and includes a timestamped version and signer identity. Use this record as part of an internal quality audit review or ISO-aligned verification process.
`;

  await fs.writeFile(tracePath, content.trim(), 'utf8');
  console.log('✅ ISO-style audit trace written to .dokugent/audit/iso-trace.md');
}