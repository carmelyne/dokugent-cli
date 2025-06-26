import { paddedLog, glyphs, PAD_WIDTH, padMsg } from '@utils/cli/ui'

export function runTokenTrustCheck({
  estimatedTokens,
  context = 'preview',
  warnAt = 4000,
  failAt = 12000,
}: {
  estimatedTokens: number;
  context?: string;
  warnAt?: number;
  failAt?: number;
}) {
  if (estimatedTokens >= failAt) {
    paddedLog(
      `${glyphs.alert} Estimated token usage (${estimatedTokens}) exceeds safe maximum (${failAt}).`,
      `Refusing to continue due to excessive token usage.`,
      72,
      'warn',
      'WARNING'
    );
    console.warn(`@caretag: warning:token-over-limit`);
    throw new Error('Refusing to continue due to excessive token usage.');
  }

  if (estimatedTokens >= warnAt) {
    paddedLog(
      `${glyphs.info} Estimated token usage is high: ${estimatedTokens} tokens.`,
      `   Consider splitting or compressing to avoid inference/runtime issues.`,
      PAD_WIDTH,
      'blue',
      'NOTICE'
    );
    console.log();
    console.warn(padMsg(`${glyphs.info} @caretag: warning:token-near-limit`));
    console.log();
  }
}
