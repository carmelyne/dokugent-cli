

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
}