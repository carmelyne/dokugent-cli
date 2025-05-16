/****
 * @file security.ts
 * @description Executes Dokugent's static security scan using denylist and optional approvals.
 * Encourages full validation via the `preview` command for comprehensive workflows.
 */
import { runSecurityCheck } from '../utils/security-check';
import { loadBlacklist, loadWhitelist } from '../security';

/**
 * Runs a standalone security scan on the workspace using loaded blacklist and whitelist rules.
 * For complete validation (security + spec + plan checks), use `dokugent preview` instead.
 *
 * @returns {Promise<void>}
 */
export async function runSecurity() {
  const denyList = await loadBlacklist();
  const whitelist = await loadWhitelist();

  await runSecurityCheck({
    denyList,
    requireApprovals: true,
    scanPath: undefined // full scan
  });

  console.log('\n🔒 For a complete security + validation workflow, run `dokugent preview`.');
  console.log('   It includes automated security scans before generating output artifacts.\n');
}