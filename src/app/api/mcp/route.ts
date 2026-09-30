import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@better-auth/mcp";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { registerAnalyticsTools } from "@/lib/mcpAnalyticsTools";
import { registerQueueTools } from "@/lib/mcpTools";
import * as z from "zod/v4";

const mcpHandler = createMcpHandler(async ({ authInfo }) => {
  const server = new McpServer({
    name: "Qzen",
    version: "0.1.0",
  });

  server.registerTool(
    "ping_qzen",
    {
      title: "Ping Qzen",
      description:
        "Checks whether the authenticated Qzen MCP connection is working.",
      inputSchema: z.object({}),
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Qzen MCP connection is working and authenticated.",
          },
        ],
      };
    }
  );

  registerQueueTools(server, authInfo);
  registerAnalyticsTools(server, authInfo);

  return server;
});

const protectedMcpHandler = requireMcpAuth(
  auth,
  async (request, accessTokenClaims) => {
    const authorization = request.headers.get("authorization");
    const token =
      authorization?.replace(/^bearer\s+/i, "") ?? String(accessTokenClaims.jti ?? "");
    const clientId =
      typeof accessTokenClaims.client_id === "string"
        ? accessTokenClaims.client_id
        : "";
    const scopes =
      typeof accessTokenClaims.scope === "string"
        ? accessTokenClaims.scope.split(" ").filter(Boolean)
        : [];

    return mcpHandler.fetch(request, {
      authInfo: {
        token,
        clientId,
        scopes,
        ...(typeof accessTokenClaims.exp === "number"
          ? { expiresAt: accessTokenClaims.exp }
          : {}),
        extra: accessTokenClaims,
      },
    });
  },
  {
    resource: process.env.MCP_RESOURCE_URL!,
    // Every request still needs `mcp:read` (Stage 1 behavior is unchanged);
    // `mcp:write` is enforced per tool inside `registerQueueTools`. Both are
    // advertised in the 401 challenge so MCP clients know they can ask for the
    // write scope.
    requiredScopes: ["mcp:read"],
    challengeScopes: ["mcp:read", "mcp:write"],
  }
);

// The MCP Inspector UI can also connect directly from the browser, which
// requires CORS on the unauthenticated 401 challenge (WWW-Authenticate) as
// well as on authenticated responses.
export async function POST(request: Request) {
  return withCors(request, await protectedMcpHandler(request));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
