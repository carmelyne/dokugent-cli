import fetch from "node-fetch";
import { resolveDokuUriToUrl } from "@utils/resolve-doku-uri";
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import chalk from 'chalk';

const MCP_URL = 'https://nldhwmukqkkwauqbbcjm.supabase.co/functions/v1/mcp';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function postToMcpServer(dokuUri: string, intent: string, input?: any) {

  // paddedLog('MCP URL', MCP_URL, PAD_WIDTH, 'info', 'FETCH');
  paddedLog('MCP URL', 'https://dokugent.com/functions/v1/mcp', PAD_WIDTH, 'blue', 'FETCH');
  const payload = {
    dokuUri,
    intent: '<REDACTED>',
  };
  const filename = dokuUri.split('/').pop(); // Extract filename from full URL
  paddedSub('URI', 'doku://' + filename || 'unknown.cert.json');

  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${intent}`,
    },
    body: JSON.stringify({ dokuUri, intent: 'trace' }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`MCP trace error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function runTraceAgent({ dokuUri, token }: { dokuUri: string; token?: string }): Promise<any> {
  const resolvedUrl = await resolveDokuUriToUrl(dokuUri);
  const jwt = token || SUPABASE_SERVICE_ROLE_KEY;
  if (!jwt) {
    throw new Error("Missing authorization token. Please set SUPABASE_SERVICE_ROLE_KEY in your env.");
  }
  const result = await postToMcpServer(resolvedUrl, jwt);
  return result;
}
