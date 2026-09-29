import { corsPreflight, withCors } from "@/lib/cors";

/**
 * Resolve the externally visible origin of this request.
 *
 * Behind Render's reverse proxy the request URL itself may be http and
 * localhost-bound, so prefer the forwarded protocol + host headers.
 */
function resolveOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : url.protocol.replace(/:$/, "");
  const host = request.headers.get("host") ?? url.host;
  return `${protocol}://${host}`;
}

/**
 * Client ID Metadata Document (RFC private draft / MCP authorization spec).
 *
 * A client whose `client_id` is this URL fetches it server-side and must get
 * back a document whose `client_id` matches the fetch URL exactly, so derive
 * it from the request origin instead of hardcoding an environment. Redirect
 * URIs cover the MCP Inspector web UI (6274) and CLI/TUI (6276) on both
 * loopback spellings — all loopback hosts are allowed for this origin-bound
 * document.
 */
export async function GET(request: Request) {
  const clientId = `${resolveOrigin(request)}/.well-known/mcp-client-metadata.json`;

  return withCors(
    request,
    Response.json({
      client_id: clientId,
      client_name: "MCP Inspector",
      redirect_uris: [
        "http://localhost:6274/oauth/callback",
        "http://127.0.0.1:6274/oauth/callback",
        "http://localhost:6276/oauth/callback",
        "http://127.0.0.1:6276/oauth/callback",
      ],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp:read mcp:write",
      application_type: "native",
    }),
  );
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
