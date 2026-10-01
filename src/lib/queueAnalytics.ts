import { getBusinessByOwner } from "@/lib/authorization";
import { getQueueHistory } from "@/lib/queueHistory";
import { QueueOperationError, requireOwnedQueue } from "@/lib/queueMutations";
import { getDateKey } from "@/lib/queueSession";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import QueueSession from "@/models/QueueSession";

/**
 * Read-only analytics over the timestamps and statuses Qzen already stores.
 *
 * Every function here:
 * - proves ownership through `getBusinessByOwner`/`requireOwnedQueue` before it
 *   reads a single document, so a caller can never name a queue it does not
 *   own and a guessed id reports the same thing as a missing one;
 * - only runs `find`/`aggregate` queries — never `getOrCreateQueueSession`, so
 *   asking for a report never creates a session or closes a stale one;
 * - attributes a customer to a day using the session's business-timezone
 *   `dateKey`, never a UTC timestamp, so "today" matches what the dashboard
 *   shows;
 * - returns counts and averages only — never a customer name or any other
 *   personally identifying field.
 *
 * Failures are `QueueOperationError`, so the MCP layer (and any future HTTP
 * route) surfaces exactly the message the rest of Qzen already uses for the
 * same condition.
 *
 * Known limitation, inherited from the schema rather than introduced here:
 * legacy `QueueEntry` rows written before sessions were backfilled have no
 * `sessionId` and are therefore invisible to session-keyed analytics. The
 * `migrate-session` script backfills them.
 */

/** Inclusive upper bound on a `get_queue_statistics` range. */
export const MAX_STATISTICS_RANGE_DAYS = 92;

/** Range used when neither `fromDate` nor `toDate` is supplied. */
export const DEFAULT_STATISTICS_RANGE_DAYS = 30;

/** Number of past days returned by `get_queue_history` when no limit is given. */
export const DEFAULT_HISTORY_LIMIT = 30;

/** Inclusive upper bound on the `get_queue_history` limit. */
export const MAX_HISTORY_LIMIT = 100;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_KEY_FORMAT_ERROR =
  "Expected a real calendar date in YYYY-MM-DD format, such as 2026-01-31.";

type Totals = {
  totalCustomers: number;
  completed: number;
  skipped: number;
  waiting: number;
  serving: number;
  serviceTimeSumMs: number;
  serviceTimeCount: number;
  waitTimeSumMs: number;
  waitTimeCount: number;
};

export type CustomerCounts = {
  total: number;
  waiting: number;
  serving: number;
  completed: number;
  skipped: number;
};

export type QueueSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type TodaySummary = {
  date: string;
  timezone: string;
  queues: {
    total: number;
    active: number;
    withSessionToday: number;
  };
  customers: CustomerCounts;
  averageWaitTimeMs: number | null;
  averageServiceTimeMs: number | null;
};

export type QueueStatistics = {
  queue: QueueSummary;
  timezone: string;
  range: {
    fromDate: string;
    toDate: string;
    days: number;
  };
  sessions: {
    total: number;
    withCustomers: number;
  };
  customers: CustomerCounts;
  averageWaitTimeMs: number | null;
  averageServiceTimeMs: number | null;
};

export type QueueHistoryDay = {
  date: string;
  status: string;
  currentToken: number;
  startedAt: Date | null;
  closedAt: Date | null;
  customers: CustomerCounts;
  averageWaitTimeMs: number | null;
  averageServiceTimeMs: number | null;
};

export type QueueHistoryReport = {
  queue: QueueSummary;
  timezone: string;
  limit: number;
  days: QueueHistoryDay[];
};

export type StatisticsRangeInput = {
  fromDate?: string;
  toDate?: string;
};

type StatisticsRange = {
  timezone: string;
  fromDate: string;
  toDate: string;
  days: number;
};

/**
 * Service time is `completedAt - calledAt`.
 *
 * Requiring both timestamps *and* that they run forwards is the same rule the
 * analytics dashboard applies, so a report can never average a negative
 * duration out of dirty data.
 */
const SERVICE_TIME_CONDITION = {
  $and: [
    { $ne: ["$calledAt", null] },
    { $ne: ["$completedAt", null] },
    { $gte: ["$completedAt", "$calledAt"] },
  ],
};

/** Wait time is `calledAt - joinedAt`, under the same ordering rule. */
const WAIT_TIME_CONDITION = {
  $and: [
    { $ne: ["$calledAt", null] },
    { $ne: ["$joinedAt", null] },
    { $gte: ["$calledAt", "$joinedAt"] },
  ],
};

function toTotals(row: Partial<Totals>): Totals {
  return {
    totalCustomers: row.totalCustomers ?? 0,
    completed: row.completed ?? 0,
    skipped: row.skipped ?? 0,
    waiting: row.waiting ?? 0,
    serving: row.serving ?? 0,
    serviceTimeSumMs: row.serviceTimeSumMs ?? 0,
    serviceTimeCount: row.serviceTimeCount ?? 0,
    waitTimeSumMs: row.waitTimeSumMs ?? 0,
    waitTimeCount: row.waitTimeCount ?? 0,
  };
}

function addTotals(left: Totals, right: Totals): Totals {
  return {
    totalCustomers: left.totalCustomers + right.totalCustomers,
    completed: left.completed + right.completed,
    skipped: left.skipped + right.skipped,
    waiting: left.waiting + right.waiting,
    serving: left.serving + right.serving,
    serviceTimeSumMs: left.serviceTimeSumMs + right.serviceTimeSumMs,
    serviceTimeCount: left.serviceTimeCount + right.serviceTimeCount,
    waitTimeSumMs: left.waitTimeSumMs + right.waitTimeSumMs,
    waitTimeCount: left.waitTimeCount + right.waitTimeCount,
  };
}

/**
 * Sums and counts rather than averages, so per-day groups can be folded into an
 * exact overall average. Averaging averages would over-weight quiet days.
 */
function averageOf(sumMs: number, count: number): number | null {
  return count > 0 ? sumMs / count : null;
}

/**
 * Counts every entry of `sessionIds`, grouped by session as well as overall.
 *
 * The caller has already proved these sessions belong to a queue the caller
 * owns, so this query never needs — and never receives — an owner id.
 */
async function aggregateEntryTotals(sessionIds: unknown[]) {
  if (sessionIds.length === 0) {
    return {
      total: toTotals({}),
      bySession: new Map<string, Totals>(),
    };
  }

  const rows = (await QueueEntry.aggregate([
    {
      $match: {
        sessionId: { $in: sessionIds },
      },
    },
    {
      $group: {
        _id: "$sessionId",

        totalCustomers: {
          $sum: 1,
        },

        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },

        skipped: {
          $sum: { $cond: [{ $eq: ["$status", "skipped"] }, 1, 0] },
        },

        waiting: {
          $sum: { $cond: [{ $eq: ["$status", "waiting"] }, 1, 0] },
        },

        serving: {
          $sum: { $cond: [{ $eq: ["$status", "serving"] }, 1, 0] },
        },

        serviceTimeSumMs: {
          $sum: {
            $cond: [
              SERVICE_TIME_CONDITION,
              { $subtract: ["$completedAt", "$calledAt"] },
              0,
            ],
          },
        },

        serviceTimeCount: {
          $sum: { $cond: [SERVICE_TIME_CONDITION, 1, 0] },
        },

        waitTimeSumMs: {
          $sum: {
            $cond: [
              WAIT_TIME_CONDITION,
              { $subtract: ["$calledAt", "$joinedAt"] },
              0,
            ],
          },
        },

        waitTimeCount: {
          $sum: { $cond: [WAIT_TIME_CONDITION, 1, 0] },
        },
      },
    },
  ])) as Array<Partial<Totals> & { _id: unknown }>;

  let total = toTotals({});
  const bySession = new Map<string, Totals>();

  for (const row of rows) {
    const totals = toTotals(row);

    total = addTotals(total, totals);
    bySession.set(String(row._id), totals);
  }

  return { total, bySession };
}

function assertDateKey(value: string, field: "fromDate" | "toDate"): string {
  if (!DATE_KEY_PATTERN.test(value)) {
    throw new QueueOperationError(`Invalid ${field}. ${DATE_KEY_FORMAT_ERROR}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));

  // Catches impossible calendar dates such as 2026-02-30, which the pattern
  // above happily matches.
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new QueueOperationError(`Invalid ${field}. ${DATE_KEY_FORMAT_ERROR}`);
  }

  return value;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    shifted.getUTCFullYear(),
    pad(shifted.getUTCMonth() + 1),
    pad(shifted.getUTCDate()),
  ].join("-");
}

function daysInclusive(fromDate: string, toDate: string): number {
  const spanMs =
    Date.parse(`${toDate}T00:00:00.000Z`) -
    Date.parse(`${fromDate}T00:00:00.000Z`);

  return Math.round(spanMs / 86_400_000) + 1;
}

/**
 * Fills in the default range and rejects anything the schema cannot answer
 * reliably: malformed or impossible dates, days the business has not reached
 * yet, backwards ranges, and ranges too wide to scan without an index.
 *
 * `dateKey` is a `YYYY-MM-DD` string, so comparing it as text is comparing it
 * chronologically.
 */
function resolveStatisticsRange(
  timezone: string,
  fromDate?: string,
  toDate?: string,
): StatisticsRange {
  const today = getDateKey(timezone);
  const resolvedTo = toDate ?? today;
  const resolvedFrom =
    fromDate ?? shiftDateKey(resolvedTo, -(DEFAULT_STATISTICS_RANGE_DAYS - 1));

  assertDateKey(resolvedFrom, "fromDate");
  assertDateKey(resolvedTo, "toDate");

  if (resolvedTo > today) {
    throw new QueueOperationError("toDate cannot be in the future.");
  }

  if (resolvedFrom > today) {
    throw new QueueOperationError("fromDate cannot be in the future.");
  }

  if (resolvedFrom > resolvedTo) {
    throw new QueueOperationError("fromDate must not be after toDate.");
  }

  const days = daysInclusive(resolvedFrom, resolvedTo);

  if (days > MAX_STATISTICS_RANGE_DAYS) {
    throw new QueueOperationError(
      `Date range cannot exceed ${MAX_STATISTICS_RANGE_DAYS} days.`,
    );
  }

  return {
    timezone,
    fromDate: resolvedFrom,
    toDate: resolvedTo,
    days,
  };
}

function summarizeQueue(queue: {
  _id: unknown;
  name?: string;
  slug?: string;
  status?: string;
}): QueueSummary {
  return {
    id: String(queue._id),
    name: queue.name ?? "",
    slug: queue.slug ?? "",
    status: queue.status ?? "active",
  };
}

/**
 * Whole-business summary of today, for the MCP `get_today_summary` tool.
 *
 * Takes no queue id on purpose: there is nothing for a caller to name, so
 * there is nothing to authorize beyond proving the account has a business.
 * It reports the live queues only — soft-deleted queues are excluded, exactly
 * like `list_queues`.
 */
export async function getTodaySummaryForOwner(
  ownerId: string,
): Promise<TodaySummary> {
  const business = await getBusinessByOwner(ownerId);

  if (!business) {
    throw new QueueOperationError("No business found for this account.");
  }

  const timezone = business.timezone || "Asia/Kolkata";
  const dateKey = getDateKey(timezone);

  // Today's summary describes the queues the business currently has, so
  // soft-deleted queues are excluded the same way `list_queues` excludes them;
  // nothing about a past day or a stored history document is touched.
  const queues = await Queue.find({
    businessId: business._id,
    deletedAt: null,
  }).lean();

  const queueIds = queues.map((queue: { _id: unknown }) => queue._id);

  const sessions =
    queueIds.length === 0
      ? []
      : await QueueSession.find({
          queueId: { $in: queueIds },
          dateKey,
        }).lean();

  const { total } = await aggregateEntryTotals(
    sessions.map((session: { _id: unknown }) => session._id),
  );

  return {
    date: dateKey,
    timezone,
    queues: {
      total: queueIds.length,
      active: queues.filter((queue: { status?: string }) => {
        return queue.status === "active";
      }).length,
      withSessionToday: sessions.length,
    },
    customers: {
      total: total.totalCustomers,
      waiting: total.waiting,
      serving: total.serving,
      completed: total.completed,
      skipped: total.skipped,
    },
    averageWaitTimeMs: averageOf(total.waitTimeSumMs, total.waitTimeCount),
    averageServiceTimeMs: averageOf(
      total.serviceTimeSumMs,
      total.serviceTimeCount,
    ),
  };
}

/**
 * Aggregates one queue over a calendar range, for the MCP
 * `get_queue_statistics` tool.
 *
 * Ownership is proven before the range is even parsed, so an invalid date on a
 * queue the caller does not own still reports "Queue not found."
 */
export async function getQueueStatisticsForOwner(
  ownerId: string,
  queueId: string,
  input: StatisticsRangeInput = {},
): Promise<QueueStatistics> {
  const { business, queue } = await requireOwnedQueue(ownerId, queueId);

  const timezone = business.timezone || "Asia/Kolkata";
  const range = resolveStatisticsRange(
    timezone,
    input.fromDate,
    input.toDate,
  );

  const sessions = await QueueSession.find({
    queueId: queue._id,
    dateKey: { $gte: range.fromDate, $lte: range.toDate },
  }).lean();

  const { total, bySession } = await aggregateEntryTotals(
    sessions.map((session: { _id: unknown }) => session._id),
  );

  return {
    queue: summarizeQueue(queue),
    timezone,
    range: {
      fromDate: range.fromDate,
      toDate: range.toDate,
      days: range.days,
    },
    sessions: {
      total: sessions.length,
      withCustomers: sessions.filter((session: { _id: unknown }) => {
        return (bySession.get(String(session._id))?.totalCustomers ?? 0) > 0;
      }).length,
    },
    customers: {
      total: total.totalCustomers,
      waiting: total.waiting,
      serving: total.serving,
      completed: total.completed,
      skipped: total.skipped,
    },
    averageWaitTimeMs: averageOf(total.waitTimeSumMs, total.waitTimeCount),
    averageServiceTimeMs: averageOf(
      total.serviceTimeSumMs,
      total.serviceTimeCount,
    ),
  };
}

/**
 * Most recent past days for one queue, newest first, for the MCP
 * `get_queue_history` tool.
 *
 * Reuses `getQueueHistory`, the same read-only aggregation the queue detail
 * page renders, so the two can never disagree. Today is never included: the
 * live picture already comes from `get_queue_status`.
 */
export async function getQueueHistoryForOwner(
  ownerId: string,
  queueId: string,
  limit: number,
): Promise<QueueHistoryReport> {
  const { business, queue } = await requireOwnedQueue(ownerId, queueId);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) {
    throw new QueueOperationError(
      `limit must be a whole number between 1 and ${MAX_HISTORY_LIMIT}.`,
    );
  }

  const history = await getQueueHistory(queueId, { limit });

  if (!history) {
    throw new QueueOperationError("Queue not found.", 404);
  }

  const timezone = business.timezone || "Asia/Kolkata";

  return {
    queue: summarizeQueue(queue),
    timezone,
    limit,
    days: history.map((row) => ({
      date: row.session.dateKey ?? "",
      status: row.session.status ?? "active",
      currentToken: row.session.currentToken ?? 0,
      startedAt: row.session.startedAt ?? null,
      closedAt: row.session.closedAt ?? null,
      customers: {
        total: row.summary.totalCustomers,
        waiting: row.summary.waiting,
        serving: row.summary.serving,
        completed: row.summary.completed,
        skipped: row.summary.skipped,
      },
      averageWaitTimeMs: row.summary.averageWaitTimeMs ?? null,
      averageServiceTimeMs: row.summary.averageServiceTimeMs ?? null,
    })),
  };
}
