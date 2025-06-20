import fs from 'fs-extra';
import path from 'path';
import { getTimestamp } from '../utils/timestamp';
import { confirmAndWriteFile } from '../utils/fs-utils';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';
import getActiveAgentInfo from '@utils/agent-info';
import { promptComplianceWizard } from '../utils/wizards/compliance-wizard';

export async function runComplianceCommand(agentId?: string) {
  if (!agentId) {
    const info = await getActiveAgentInfo();
    agentId = info.agentId;
  }

  console.log(`\n🛡️  Filling out compliance fields for: ${agentId}\n`);

  const answers = await promptComplianceWizard();

  const now = new Date();
  const output = {
    complianceOfficer: {
      name: answers.complianceSigner.name,
      email: answers.complianceSigner.email,
      role: 'Governance Contact (AIGP/GDPR)',
      signerId: `${answers.complianceSigner.email}#${answers.complianceSigner.fingerprint}`,
      publicKey: answers.complianceSigner.publicKey,
      fingerprint: answers.complianceSigner.fingerprint,
      sha256: null
    },
    dataRetention: answers.dataRetention,
    dataSensitivity: answers.dataSensitivity,
    legalBasis: answers.legalBasis,
    authorizedUsers: answers.authorizedUsers,
    purpose: answers.purpose,
    dataSources: answers.dataSources,
    transfersOutsideJurisdiction: answers.transfersOutsideJurisdiction,
    usesProfiling: answers.usesProfiling,
    selfAssessedRisk: answers.selfAssessedRisk,
    supportsDSAR: answers.supportsDSAR,
    complianceDateAt: now.toISOString(),
    complianceDateAtDisplay: now.toLocaleString(),
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
  };

  const info = await getActiveAgentInfo();
  agentId = info.agentId;
  const agentSlug = info.agentSlug;
  const compliancePath = path.resolve('.dokugent/data/compliance', agentSlug, 'compliance.json');
  await confirmAndWriteFile(compliancePath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Compliance metadata saved to:\n   \x1b[34m.dokugent/data/compliance/${agentSlug}/compliance.json\x1b[0m\n`);
}
