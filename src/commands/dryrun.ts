

import path from 'path';
import fs from 'fs-extra';
import { walkPlan, PlanStep } from '../core/dryrun/walkPlan';

export async function runDryrunCommand() {
  // NOTE: dryrun assumes that `init`, `plan`, `io`, and `compliance` have already been executed
  const certDir = path.join(process.cwd(), '.dokugent/certified/latest');
  const certPath = path.join(certDir, 'doku.json');

  if (!(await fs.pathExists(certPath))) {
    console.error('❌ No certified doku.json found. Please run `dokugent certify` first.');
    return;
  }

  const dokuMeta = await fs.readJson(certPath);
  const { agent, owner, signer = 'unknown', summary = 'No summary provided' } = dokuMeta;
  // TODO: Add deeper validation of required doku fields when init/io/compliance are modularized

  const planPath = path.join(certDir, 'plan.cert.json');
  if (!(await fs.pathExists(planPath))) {
    console.error('❌ No certified plan found in the bundle.');
    return;
  }

  const planData: PlanStep[] = await fs.readJson(planPath);
  const report = walkPlan(agent, owner, signer, summary, planData);

  const logPath = path.join(process.cwd(), '.dokugent/logs/dryrun.log');
  const reportPath = path.join(process.cwd(), '.dokugent/reports/dryrun.json');
  await fs.ensureFile(logPath);
  await fs.ensureFile(reportPath);

  const logContent = report.steps.map(s => `🔧 ${s.step} → ${s.note}`).join('\n');
  await fs.writeFile(logPath, logContent, 'utf8');
  await fs.writeJson(reportPath, report, { spaces: 2 });

  console.log('✅ Dryrun complete (note: ensure `init`, `io`, and `compliance` are properly filled for meaningful results).');
  console.log(`📄 Log written to: ${logPath}`);
  console.log(`📊 JSON report at: ${reportPath}`);
}