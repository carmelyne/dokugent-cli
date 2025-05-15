import { runSecurityCheck } from '../utils/security-check';
import { loadBlacklist, loadWhitelist } from '../security';

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