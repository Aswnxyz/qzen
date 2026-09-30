import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  READ_ONLY_ANNOTATIONS,
  ToolInputError,
  getAuthenticatedUserId,
  handleToolError,
  toIsoDate,
  toolResult,
} from "@/lib/mcpShared";
import {
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_STATISTICS_RANGE_DAYS,
  MAX_HISTORY_LIMIT,
  MAX_STATISTICS_RANGE_DAYS,
  getQueueHistoryForOwner,
  getQueueStatisticsForOwner,
  getTodaySummaryForOwner,
} from "@/lib/queueAnalytics";

/**
 * Stage 3: read-only analytics tools.
 *
 * The pattern matches the Stage 1 read tools exactly — resolve the identity
 * from the verified token claims, hand it to a service that re-proves
 * ownership, and route every failure through `handleToolError`.
 *
 * Nothing here accepts an ownerId, a businessId or any other identity, and
 * there is no generic query or aggregation tool: each tool has a fixed shape
 * and reports counts and averages only, never a customer name.
 */

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_KEY_FORMAT_ERROR =
  "Expected a date in YYYY-MM-DD format, such as 2026-01-31.";

const dateKeySchema = z
  .string()
  .regex(DATE_KEY_PATTERN, DATE_KEY_FORMAT_ERROR)
  .describe(
    "A calendar date in YYYY-MM-DD format, interpreted in the business timezone.",
  );

export function registerAnalyticsTools(server: McpServer, authInfo?: AuthInfo) {
  const ownerId = getAuthenticatedUserId(authInfo);

  /**
   * A summary of today across the whole business.
   *
   * Zero input by design: there is nothing for a caller to name, so there is
   * nothing to authorize beyond proving the account has a business.
   */
  server.registerTool(
    "get_today_summary",
    {
      title: "Get today summary",
      description:
        "Whole-business summary for today in the business timezone: how many queues are open, how many customers were taken, and the average wait and service times. Read-only; takes no arguments.",
      inputSchema: z.object({}),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      try {
        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const summary = await getTodaySummaryForOwner(ownerId);

        return toolResult({
          success: true,
          ...summary,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  /**
   * Aggregate statistics for one queue over a calendar range.
   *
   * The range is deliberately bounded: `QueueSession` is indexed on
   * `{ queueId, dateKey }` but `QueueEntry` is not, so a range is scanned
   * through its sessions rather than across the whole entry collection.
   */
  server.registerTool(
    "get_queue_statistics",
    {
      title: "Get queue statistics",
      description: `Aggregates one queue over a calendar range in the business timezone: total customers, how they ended, and the average wait and service times. Read-only. fromDate and toDate are optional and default to the last ${DEFAULT_STATISTICS_RANGE_DAYS} days ending today; the range cannot exceed ${MAX_STATISTICS_RANGE_DAYS} days.`,
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to measure."),
        fromDate: dateKeySchema
          .optional()
          .describe(
            `First day to include, YYYY-MM-DD. Defaults to ${DEFAULT_STATISTICS_RANGE_DAYS} days before toDate.`,
          ),
        toDate: dateKeySchema
          .optional()
          .describe(
            "Last day to include, YYYY-MM-DD. Defaults to today in the business timezone.",
          ),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ queueId, fromDate, toDate }) => {
      try {
        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const statistics = await getQueueStatisticsForOwner(ownerId, queueId, {
          fromDate,
          toDate,
        });

        return toolResult({
          success: true,
          ...statistics,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  /**
   * Day-by-day history for one queue, newest first.
   *
   * Today is intentionally absent: the live picture already comes from
   * `get_queue_status`, and the dashboard's history view also only covers days
   * that have closed.
   */
  server.registerTool(
    "get_queue_history",
    {
      title: "Get queue history",
      description: `Per-day totals for the most recent past days of a queue, newest first, with each day's wait and service averages. Read-only; today is not included. limit is optional and defaults to ${DEFAULT_HISTORY_LIMIT} (maximum ${MAX_HISTORY_LIMIT}).`,
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to inspect."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_HISTORY_LIMIT)
          .optional()
          .describe(
            `How many past days to return, 1-${MAX_HISTORY_LIMIT}. Defaults to ${DEFAULT_HISTORY_LIMIT}.`,
          ),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ queueId, limit }) => {
      try {
        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const history = await getQueueHistoryForOwner(
          ownerId,
          queueId,
          limit ?? DEFAULT_HISTORY_LIMIT,
        );

        return toolResult({
          success: true,
          queue: history.queue,
          timezone: history.timezone,
          limit: history.limit,
          days: history.days.map((day) => ({
            ...day,
            startedAt: toIsoDate(day.startedAt),
            closedAt: toIsoDate(day.closedAt),
          })),
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
