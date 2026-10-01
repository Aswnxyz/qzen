import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { updateBusinessSettingsForOwner } from "@/lib/businessMutations";
import {
  DEFAULT_TIMEZONE,
  STATUS_ANNOTATIONS,
  ToolInputError,
  getAuthenticatedUserId,
  getScopes,
  handleToolError,
  requireWriteScope,
  toolResult,
} from "@/lib/mcpShared";

/**
 * Stage 4: the business-settings write tool.
 *
 * The shape matches the queue tools exactly: identity comes only from the
 * verified access-token claims, `mcp:write` is checked before any database
 * work, and every failure goes through `handleToolError`. The update itself
 * lives in `businessMutations`, which the dashboard's `PATCH /api/businesses`
 * also uses, so nothing about Qzen's business rules is re-implemented here.
 */
export function registerBusinessTools(server: McpServer, authInfo?: AuthInfo) {
  const ownerId = getAuthenticatedUserId(authInfo);
  const writeScopes = getScopes(authInfo);

  server.registerTool(
    "update_business_settings",
    {
      title: "Update business settings",
      description:
        "Updates the name and timezone of the authenticated user's own business. Requires the mcp:write scope. The business is resolved from the verified identity, so no businessId is ever accepted from the caller, and the business slug is never accepted as input because it is the public join URL and QR code target.",
      inputSchema: z.object({
        name: z.string().min(1).describe("New display name for the business."),
        timezone: z
          .string()
          .min(1)
          .describe(
            "Timezone for the business, for example Asia/Kolkata. Must be one of the timezones Qzen supports.",
          ),
      }),
      annotations: STATUS_ANNOTATIONS,
    },
    async ({ name, timezone }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { business } = await updateBusinessSettingsForOwner(ownerId, {
          name,
          timezone,
        });

        return toolResult({
          success: true,
          business: {
            id: String(business._id),
            name: business.name,
            slug: business.slug,
            timezone: business.timezone || DEFAULT_TIMEZONE,
          },
        });
      } catch (error) {
        return handleToolError(error, "Failed to update business settings");
      }
    },
  );
}
