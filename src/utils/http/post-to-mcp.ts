const MCP_SERVER_URL = "https://nldhwmukqkkwauqbbcjm.supabase.co/functions/v1/mcp";
import fetch from "node-fetch";

type MCPRequestPayload = {
  dokuUri: string;
  intent: string;
  input?: string;
};

export async function postToMcpServer(
  uri: string,
  intent: string
): Promise<any> {
  const payload: MCPRequestPayload = {
    dokuUri: uri,
    intent,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}
