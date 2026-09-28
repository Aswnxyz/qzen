import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "qzen-mcp",
  version: "0.1.0",
  description: "AI interface for Qzen queue management.",
});

server.registerTool(
  "ping_qzen",
  {
    title: "Ping Qzen",
    description: "Verify that the Qzen MCP server is running.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          ok: true,
          service: "qzen-mcp",
          version: "0.1.0",
        }),
      },
    ],
  }),
);

await serveStdio(() => server);
console.error("Qzen MCP server running on stdio");
