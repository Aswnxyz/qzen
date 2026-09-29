import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { corsPreflight, withCors } from "@/lib/cors";

const handlers = toNextJsHandler(auth);

// MCP clients perform OAuth discovery, dynamic client registration and token
// exchange from another origin (the MCP Inspector UI on localhost), so every
// response needs CORS headers. better-auth's own origin check still rejects
// cookie-bearing cross-origin mutations independently of these headers.
export async function GET(request: Request) {
  return withCors(request, await handlers.GET(request));
}

export async function POST(request: Request) {
  return withCors(request, await handlers.POST(request));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
