import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@better-auth/mcp";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
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
    async (_args, _ctx) => {
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

  return server;
});

export const POST = requireMcpAuth(
  auth,
  async (request) => {
    return mcpHandler.fetch(request);
  },
  {
    resource: process.env.MCP_RESOURCE_URL!,
    requiredScopes: ["mcp:read"],
  }
);