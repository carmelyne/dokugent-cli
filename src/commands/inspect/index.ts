import fs, { readdirSync } from 'fs';
import path from 'path';
import { ui, paddedLog, paddedSub } from '@utils/cli/ui';
import { estimateTokensFromText, warnIfExceedsLimit } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { AGENT_DIR, CERT_DIR, BYO_DIR, LOG_DIR, REPORTS_DIR, AGENTS_CONFIG_DIR, COMPILED_DIR } from '@constants/paths';
import { runTraceAgent } from "@domain/trace/runner";
import { resolveDokuUriToUrl } from "@utils/resolve-doku-uri";
import { isDokuUri } from '@utils/is-doku-uri'

export async function runInspectCommand() {
  const flagIndex = process.argv.indexOf('--show');
  const showSection = flagIndex !== -1 ? process.argv[flagIndex + 1] : null;

  // -- TODO 1 —
  // Identify if input is a local file or a remote MCP URI (doku://)
  const input = process.argv[3]; // argv[2] is 'inspect', argv[3] is the first param
  if (!input) {
    paddedLog('Missing input', 'Provide a local file or doku:// URI to inspect.', 12, 'warn');
    process.exit(1);
  }

  const isRemoteUri = input.startsWith('doku://');
  paddedLog('Source detected', isRemoteUri ? 'MCP Remote URI' : 'Local file path', 12, 'info');
  paddedSub('🔍 Inspecting', input);

  let certContent: string;

  // -- TODO 2 —
  // Load and parse file contents from local disk or fetch from remote MCP
  if (isDokuUri(input)) {
    const [_, dokuPath] = input.split('doku://');
    const [agentName, birthTimestamp] = dokuPath.split('@');
    const compiledDir = path.join(COMPILED_DIR, agentName);
    const matchingFiles = readdirSync(compiledDir)
      .filter(f => f.startsWith(`${agentName}@${birthTimestamp}.compiled.v`) && f.endsWith('.cert.json'))
      .sort((a, b) => {
        const versionA = parseInt(a.match(/\.v(\d+)\.cert\.json$/)?.[1] || '0');
        const versionB = parseInt(b.match(/\.v(\d+)\.cert\.json$/)?.[1] || '0');
        return versionB - versionA;
      });
    const latestCertFile = matchingFiles.at(0);
    const remoteUrl = `https://nldhwmukqkkwauqbbcjm.supabase.co/storage/v1/object/public/dokus/${agentName}/${latestCertFile}`;
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      paddedLog('Fetch failed', `Unable to fetch ${remoteUrl} (status ${response.status})`, 12, 'error');
      process.exit(1);
    }
    certContent = await response.text();
  } else {
    try {
      certContent = fs.readFileSync(path.resolve(input), 'utf-8');
    } catch (err: any) {
      paddedLog('Read error', `Could not read local file: ${err.message}`, 12, 'error');
      process.exit(1);
    }
  }

  // Attempt to parse certificate JSON
  let cert;
  try {
    cert = JSON.parse(certContent);
  } catch {
    paddedLog('Parse error', 'Invalid JSON in certificate file.', 12, 'error');
    process.exit(1);
  }
  // TODO 3: Display key metadata: agent ID, createdAt, signer, certifier, previewer
  // TODO 4: Estimate tokens and show content size
  // TODO 5: If using MCP, validate cert exists and show storage source
  if (cert?.metadata) {
    if (cert.metadata.format) {
      paddedSub('📄 Cert Format', cert.metadata.format);
    }
    if (cert.metadata.version) {
      paddedSub('🧾 Cert Version', cert.metadata.version);
    }
  }

  if (showSection && cert) {
    const sectionData = cert[showSection] || cert.metadata?.[showSection];
    if (sectionData) {
      paddedSub(`📍 ${showSection}`, JSON.stringify(sectionData, null, 2));
    } else {
      paddedSub('⚠️ Not found', `Section '${showSection}' not found in certificate.`);
    }
  }

  paddedLog('Inspect completed', '', 12, 'success');
}
