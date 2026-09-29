import { auth } from "@/lib/auth";
import { corsPreflight, withCors } from "@/lib/cors";

/**
 * RFC 8414 authorization-server metadata.
 *
 * MCP clients discover AS metadata for the issuer
 * `https://<host>/api/auth` at the path-inserted URL
 * `/.well-known/oauth-authorization-server/api/auth` (and some clients use
 * `/.well-known/openid-configuration/api/auth`). Next.js routes only
 * `/api/auth/*` to `auth.handler`, so those root-level paths 404'd and broke
 * discovery. The oauth-provider plugin's `onRequest` hook answers the
 * path-inserted form as soon as the request reaches the auth handler.
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
