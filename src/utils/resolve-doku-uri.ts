/**
 * Resolves a custom Dokugent-style dokuUri into an actual HTTPS URL pointing
 * to the expected Supabase storage object location.
 *
 * @example
 * doku://happybot@2025-05-24_19-15-55-492
 * → https://<supabase-url>/storage/v1/object/public/dokus/happybot/happybot@2025-05-24_19-15-55-492.compiled.v34.cert.json
 */
import fs from 'fs';
import path from 'path';

export async function resolveDokuUriToUrl(dokuUri: string): Promise<string> {
  const SUPABASE_BASE =
    "https://nldhwmukqkkwauqbbcjm.supabase.co/storage/v1/object/public/dokus";

  // Full URI with versioned file already in place
  if (dokuUri.includes('.compiled.v') && dokuUri.endsWith('.cert.json')) {
    const pattern = /^doku:\/\/([a-zA-Z0-9_-]+)@(.+\.compiled\.v\d+\.cert\.json)$/;
    const match = dokuUri.match(pattern);
    if (!match) {
      throw new Error(`Invalid fully versioned dokuUri: ${dokuUri}`);
    }
    const [_, agentName, rest] = match;
    const filename = `${agentName}@${rest}`;
    const safeFolder = `${agentName}__${rest.split('.')[0]}`; // Extract timestamp safely
    return `${SUPABASE_BASE}/${safeFolder}/${filename}`;
  }

  // Handle URIs like doku://agent@timestamp.compiled.cert.json (no version)
  // if (dokuUri.includes('.compiled.cert.json')) {
  //   const pattern = /^doku:\/\/([a-zA-Z0-9_-]+)@(.+)\.compiled\.cert\.json$/;
  //   const match = dokuUri.match(pattern);
  //   if (!match) {
  //     throw new Error(`Invalid dokuUri format: ${dokuUri}`);
  //   }
  //   const [_, agentName, timestamp] = match;

  //   const compiledFolder = path.join('.dokugent/ops/compiled', agentName.replace('@', '__'));
  //   const baseName = `${agentName}@${timestamp}.compiled`;
  //   const possibleFiles = fs.existsSync(compiledFolder)
  //     ? fs.readdirSync(compiledFolder).filter(f => f.startsWith(baseName) && f.endsWith('.cert.json'))
  //     : [];

  //   if (possibleFiles.length === 0) {
  //     throw new Error(
  //       `No compiled cert found for ${agentName}@${timestamp}. ` +
  //       `Try using a fully versioned doku URI like: doku://${agentName}@${timestamp}.compiled.vX.cert.json`
  //     );
  //   }

  //   const bestMatch = possibleFiles.sort().reverse()[0];
  //   return `${SUPABASE_BASE}/${agentName}/${bestMatch}`;
  // }

  // Else: resolve latest version by timestamp
  const pattern = /^doku:\/\/([a-zA-Z0-9_-]+)@(.+)$/;
  const match = dokuUri.match(pattern);

  if (!match) {
    throw new Error(`Invalid dokuUri format: ${dokuUri}`);
  }

  const [_, agentName, timestamp] = match;

  const safeFolder = `${agentName}__${timestamp}`;
  const baseName = `${agentName}@${timestamp}.compiled`;

  const versionsToTry = Array.from({ length: 50 }, (_, i) => 50 - i); // try v50 to v1
  for (const v of versionsToTry) {
    const filename = `${baseName}.v${v}.cert.json`;
    const fullUrl = `${SUPABASE_BASE}/${safeFolder}/${filename}`;
    try {
      const res = await fetch(fullUrl, { method: 'HEAD' });
      if (res.ok) return fullUrl;
    } catch { }
  }
  throw new Error(`No compiled cert found for ${agentName}@${timestamp} in Supabase storage.`);
}
