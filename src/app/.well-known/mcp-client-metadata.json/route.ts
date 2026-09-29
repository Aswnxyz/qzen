export async function GET() {
  const clientId =
    "https://qzen.onrender.com/.well-known/mcp-client-metadata.json";

  return Response.json({
    client_id: clientId,
    client_name: "MCP Inspector",
    redirect_uris: [
      "http://127.0.0.1:6274/oauth/callback",
    ],
    grant_types: [
      "authorization_code",
      "refresh_token",
    ],
    response_types: [
      "code",
    ],
    token_endpoint_auth_method: "none",
    scope: "mcp:read",
    application_type: "native",
  });
}