const ALLOWED_HEADERS = [
  "Accept",
  "Authorization",
  "Content-Type",
  "Last-Event-ID",
  "MCP-Protocol-Version",
  "MCP-Session-Id",
  "Origin",
  "X-Requested-With",
];

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS";

const EXPOSED_HEADERS = "WWW-Authenticate, Content-Type, MCP-Session-Id";

/**
 * MCP clients such as MCP Inspector run their OAuth discovery, dynamic client
 * registration and token exchange from a browser page on another origin (for
 * example http://localhost:6274). Those requests need CORS headers on the
 * response or the browser cannot read it.
 *
 * Reflecting the request origin here is safe:
 * - the endpoints guarded by this helper are public OAuth metadata /
 *   registration / token endpoints, or bearer-token endpoints (the bearer
 *   token itself is never readable without already knowing it);
 * - cookie-bearing cross-origin mutations are still rejected by better-auth's
 *   own origin check, which runs independently of these headers.
 */
export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin");

  headers.set("Access-Control-Allow-Origin", origin ?? "*");
  headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
  headers.set("Access-Control-Expose-Headers", EXPOSED_HEADERS);
  if (origin) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.append("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Answers a CORS preflight for the endpoints above. */
export function corsPreflight(request: Request): Response {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers":
      request.headers.get("access-control-request-headers") ??
      ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return new Response(null, { status: 204, headers });
}
