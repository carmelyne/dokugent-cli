/**
 * Resolves a custom Dokugent-style dokuUri into an actual HTTPS URL pointing
 * to the expected Supabase storage object location.
 *
 * @example
 * doku://happybot@2025-05-24_19-15-55-492
 * → https://<supabase-url>/storage/v1/object/public/dokus/happybot/happybot@2025-05-24_19-15-55-492.compiled.v34.cert.json
 */
export function resolveDokuUriToUrl(dokuUri: string): string {
  const SUPABASE_BASE =
    "https://nldhwmukqkkwauqbbcjm.supabase.co/storage/v1/object/public/dokus";

  const pattern = /^doku:\/\/([a-zA-Z0-9_-]+)@(.+)$/;
  const match = dokuUri.match(pattern);

  if (!match) {
    throw new Error(`Invalid dokuUri format: ${dokuUri}`);
  }

  const [_, agentName, timestamp] = match;
  return `${SUPABASE_BASE}/${agentName}/${agentName}@${timestamp}.compiled.v34.cert.json`;
}
