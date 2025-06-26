/****
 * @file security.ts
 * @description Executes Dokugent's static security scan using denylist and optional approvals.
 * Encourages full validation via the `preview` command for comprehensive workflows.
 */
import { runSecurityCheck } from '@utils/security-check';
import { loadBlacklist, loadWhitelist } from './loaders';
export { loadBlacklist, loadWhitelist } from './loaders';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import { runTokenTrustCheck } from '@utils/security/token-check';
/**
 * Runs a standalone security scan on the workspace using loaded blacklist and whitelist rules.
 * For complete validation (security + spec + plan checks), use `dokugent preview` instead.
 *
 * @returns {Promise<void>}
 */
export async function runSecurity() {
  const denyList = await loadBlacklist();
  const whitelist = await loadWhitelist();

  // Estimate: placeholder value until integrated with real token count
  runTokenTrustCheck({ estimatedTokens: 4500, context: 'security' });

  await runSecurityCheck('security', {
    denyList,
    requireApprovals: true
  });

  paddedLog('For a complete security + validation workflow,', 'run dokugent preview', PAD_WIDTH, 'blue', 'HELP');
  console.log()
  paddedDefault('', 'It includes automated security scans before generating output artifacts.\n', '', '');
}
