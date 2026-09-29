import { auth } from "@/lib/auth";
import { corsPreflight, withCors } from "@/lib/cors";

/**
 * RFC 9728 protected-resource metadata.
 *
 * The MCP plugin serves both `/.well-known/oauth-protected-resource` and the
 * path-suffixed `/.well-known/oauth-protected-resource/api/mcp` form that MCP
 * clients actually request (the URL advertised in the WWW-Authenticate
 * challenge), but only when the request reaches `auth.handler`. Next.js only
 * routes `/api/auth/*` to the auth handler by default, so this catch-all
 * forwards every path under `/.well-known/oauth-protected-resource` to it.
 */
export async function GET(request: Request) {
  return withCors(request, await auth.handler(request));
}

export async function HEAD(request: Request) {
  return withCors(request, await auth.handler(request));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
