// Stage 3 end-to-end test for the Qzen MCP analytics tools (local).
//
// Runs the real OAuth flow against the running server and exercises the three
// read-only analytics tools:
//   - tools/list exposes them with read-only annotations and no identity inputs
//   - get_today_summary reports the whole business without creating a session
//   - get_queue_statistics aggregates an exact range to the exact millisecond
//   - get_queue_history returns past days only, newest first, honouring limit
//   - invalid dates, impossible dates, future dates and oversized ranges rejected
//   - another business's queue reports the same thing as one that does not exist
//   - a client-supplied ownerId/businessId is never treated as identity
//   - analytics output carries counts and averages only — never a customer name
//   - calling any of them writes nothing: no sessions, no entries, no queues
//
// Requires: the server running on BASE_URL, MONGODB_URI set (and .env.local).
//   npm start
//   npm run test:analytics
import { MongoClient, ObjectId } from "mongodb";

import { createHarness } from "./e2e-mcp-lib.mjs";

const harness = createHarness();
const {
  BASE,
  RESOURCE,
  callMcp,
  callTool,
  check,
  discover,
  ensureTestUser,
  getAccessToken,
  initialize,
} = harness;

const ANALYTICS_TOOLS = [
  "get_today_summary",
  "get_queue_statistics",
  "get_queue_history",
];

const TIMEZONE = "Asia/Kolkata";

// The server resolves "today" with exactly this format in the business
// timezone, so the test can name the same days the server will match on.
function dateKey(offsetDays = 0) {
  const when = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

const average = (values) =>
  values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null;

async function main() {
  console.log(`Target: ${BASE} (${RESOURCE})`);

  const probe = await fetch(RESOURCE, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
    .catch(() => null);
  if (!probe) {
    console.error(`FATAL: cannot reach ${BASE} — start the server first (npm start).`);
    process.exit(2);
  }

  await ensureTestUser();
  const { asMeta } = await discover();

  console.log("\n=== A. access tokens ===");
  const tokenRW = await getAccessToken(asMeta, "mcp:read mcp:write", "stage3-rw");
  const tokenRO = await getAccessToken(asMeta, "mcp:read", "stage3-ro");
  check("read+write token issued", !!tokenRW);
  check("read-only token issued", !!tokenRO);

  const init = await initialize(tokenRW, { name: "stage3-e2e", version: "0.0.1" });
  const negotiated = init.negotiated;
  check("initialize (read+write)", init.ok, `protocol ${negotiated}`);
  const initRO = await initialize(tokenRO, { name: "stage3-e2e", version: "0.0.1" });
  check("initialize (read-only)", initRO.ok, `protocol ${initRO.negotiated}`);

  const mongo = new MongoClient(process.env.MONGODB_URI);
  await mongo.connect();
  const authDb = mongo.db("qzen");
  const app = mongo.db("test");

  const stamp = Date.now();
  const createdIds = { queues: [], businesses: [] };
  let business = null;
  let businessCreated = false;
  let otherBusiness = null;
  let otherQueue = null;
  let freshQueue = null;
  let analyticsQueue = null;

  // Seeded timings, in exact milliseconds, so the averages can be asserted to
  // the millisecond rather than "roughly right".
  const WAIT_A = 60_000;
  const WAIT_B = 120_000;
  const WAIT_C = 30_000;
  const SERVICE_A = 180_000;
  const SERVICE_B = 180_000;
  const SERVICE_C = 60_000;

  try {
    console.log("\n=== B. fixtures ===");
    const user = await authDb.collection("user").findOne({ email: process.env.TEST_EMAIL ?? "mcp-oauth-test@qzen.local" });
    check("test user exists", !!user, String(user?._id));
    if (!user) throw new Error("aborting: no test user");

    const ownerId = typeof user._id === "object" ? user._id : new ObjectId(String(user._id));

    business = await app.collection("businesses").findOne({ ownerId });
    if (!business) {
      const now = new Date();
      const doc = {
        name: "Stage 3 E2E",
        ownerId,
        slug: `stage3-e2e-${stamp}`,
        timezone: TIMEZONE,
        createdAt: now,
        updatedAt: now,
      };
      const r = await app.collection("businesses").insertOne(doc);
      business = { ...doc, _id: r.insertedId };
      businessCreated = true;
    }
    check("owner business available", !!business, businessCreated ? "created by this run" : "pre-existing");

    const now = new Date();

    // A queue with no session at all: proves analytics never creates one.
    const freshInsert = await app.collection("queues").insertOne({
      businessId: business._id,
      name: "Stage 3 Fresh",
      slug: `stage3-fresh-${stamp}`,
      status: "active",
      currentToken: 0,
      averageServiceTime: 10,
      createdAt: now,
      updatedAt: now,
    });
    freshQueue = { _id: freshInsert.insertedId };
    createdIds.queues.push(freshQueue._id);

    // The measured queue: three closed-out days worth of sessions.
    const analyticsInsert = await app.collection("queues").insertOne({
      businessId: business._id,
      name: "Stage 3 Analytics",
      slug: `stage3-analytics-${stamp}`,
      status: "active",
      currentToken: 3,
      averageServiceTime: 10,
      createdAt: now,
      updatedAt: now,
    });
    analyticsQueue = { _id: analyticsInsert.insertedId };
    createdIds.queues.push(analyticsQueue._id);

    const today = dateKey(0);
    const yesterday = dateKey(-1);
    const threeDaysAgo = dateKey(-3);
    check(
      "seed days are ordered and in the past",
      threeDaysAgo < yesterday && yesterday < today,
      `${threeDaysAgo} < ${yesterday} < ${today}`,
    );

    const insertSession = (dateKey_, status, currentToken) =>
      app.collection("queuesessions").insertOne({
        queueId: analyticsQueue._id,
        dateKey: dateKey_,
        status,
        currentToken,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      });

    const sOld = await insertSession(threeDaysAgo, "closed", 1);
    const sYest = await insertSession(yesterday, "closed", 3);
    const sToday = await insertSession(today, "active", 0);

    const entry = (sessionId, tokenNumber, status, joinedMs, calledMs, completedMs) => ({
      queueId: analyticsQueue._id,
      sessionId,
      tokenNumber,
      // Deliberately recognisable: if any analytics payload ever echoes a
      // customer name, these strings will show up in the assertion below.
      customerName: `PII-Customer-${tokenNumber}`,
      status,
      joinedAt: joinedMs === null ? null : new Date(joinedMs),
      calledAt: calledMs === null ? null : new Date(calledMs),
      completedAt: completedMs === null ? null : new Date(completedMs),
      createdAt: now,
      updatedAt: now,
    });

    const base = Date.now() - 3_600_000;
    await app.collection("queueentries").insertMany([
      // Three days ago: one completed customer, 30s wait, 60s service.
      entry(sOld.insertedId, 1, "completed", base, base + WAIT_C, base + WAIT_C + SERVICE_C),
      // Yesterday: two completed (60s/120s waits, 180s services) + one never called.
      entry(sYest.insertedId, 1, "completed", base, base + WAIT_A, base + WAIT_A + SERVICE_A),
      entry(sYest.insertedId, 2, "completed", base, base + WAIT_B, base + WAIT_B + SERVICE_B),
      entry(sYest.insertedId, 3, "waiting", base, null, null),
      // Today: still waiting, so it has no measured wait or service time.
      entry(sToday.insertedId, 1, "waiting", Date.now(), null, null),
    ]);

    // A legacy row with no sessionId: the schema allows it and session-keyed
    // analytics must not silently count it.
    await app.collection("queueentries").insertOne({
      queueId: analyticsQueue._id,
      sessionId: null,
      tokenNumber: 99,
      customerName: "PII-Customer-legacy",
      status: "completed",
      joinedAt: new Date(base),
      calledAt: new Date(base + 5_000),
      completedAt: new Date(base + 15_000),
      createdAt: now,
      updatedAt: now,
    });

    // Another business entirely, to prove analytics cannot cross the boundary.
    const otherOwnerId = new ObjectId();
    const otherBusinessInsert = await app.collection("businesses").insertOne({
      name: "Someone Else",
      ownerId: otherOwnerId,
      slug: `stage3-other-${stamp}`,
      timezone: TIMEZONE,
      createdAt: now,
      updatedAt: now,
    });
    otherBusiness = { _id: otherBusinessInsert.insertedId, ownerId };
    createdIds.businesses.push(otherBusiness._id);

    const otherQueueInsert = await app.collection("queues").insertOne({
      businessId: otherBusiness._id,
      name: "Someone Else's Queue",
      slug: `stage3-other-queue-${stamp}`,
      status: "active",
      currentToken: 0,
      averageServiceTime: 10,
      createdAt: now,
      updatedAt: now,
    });
    otherQueue = { _id: otherQueueInsert.insertedId };
    createdIds.queues.push(otherQueue._id);

    check(
      "fixtures ready",
      !!analyticsQueue?._id && !!freshQueue?._id && !!otherQueue?._id,
      `analytics=${analyticsQueue._id} fresh=${freshQueue._id} other=${otherQueue._id}`,
    );

    console.log("\n=== C. tools/list, annotations and input schemas ===");
    const tools = await callMcp(tokenRW, { method: "tools/list", params: {} }, negotiated);
    const list = tools.payload?.result?.tools ?? [];
    const byName = Object.fromEntries(list.map((t) => [t.name, t]));
    check(
      "tools/list exposes all three analytics tools",
      ANALYTICS_TOOLS.every((n) => !!byName[n]),
      JSON.stringify(list.map((t) => t.name)),
    );

    const ann = (n) => byName[n]?.annotations ?? {};
    check(
      "analytics tools are advertised read-only",
      ANALYTICS_TOOLS.every((n) => ann(n).readOnlyHint === true),
      ANALYTICS_TOOLS.map((n) => `${n}:${ann(n).readOnlyHint}`).join(" "),
    );
    check(
      "analytics tools are non-destructive",
      ANALYTICS_TOOLS.every((n) => ann(n).destructiveHint === false),
      ANALYTICS_TOOLS.map((n) => `${n}:${ann(n).destructiveHint}`).join(" "),
    );

    const props = (n) => byName[n]?.inputSchema?.properties ?? {};
    check(
      "get_today_summary takes no input at all",
      Object.keys(props("get_today_summary")).length === 0,
      JSON.stringify(props("get_today_summary")),
    );
    check(
      "get_queue_statistics exposes queueId/fromDate/toDate only",
      Object.keys(props("get_queue_statistics")).sort().join(",") === "fromDate,queueId,toDate",
      JSON.stringify(Object.keys(props("get_queue_statistics"))),
    );
    check(
      "get_queue_history exposes queueId/limit only",
      Object.keys(props("get_queue_history")).sort().join(",") === "limit,queueId",
      JSON.stringify(Object.keys(props("get_queue_history"))),
    );

    const identityKeys = ["ownerId", "businessId", "userId", "accountId"];
    check(
      "no analytics tool accepts an identity or a business id",
      ANALYTICS_TOOLS.every((n) => !identityKeys.some((k) => Object.keys(props(n)).includes(k))),
      ANALYTICS_TOOLS.map((n) => `${n}:${Object.keys(props(n)).join("|")}`).join(" "),
    );

    console.log("\n=== D. get_today_summary ===");
    const ownerQueues = await app.collection("queues").find({ businessId: business._id }).toArray();
    const ownerQueueIds = ownerQueues.map((q) => q._id);
    const todaySessions = ownerQueueIds.length
      ? await app.collection("queuesessions").find({ queueId: { $in: ownerQueueIds }, dateKey: dateKey(0) }).toArray()
      : [];
    const todaySessionIds = todaySessions.map((s) => s._id);
    const todayEntries = todaySessionIds.length
      ? await app.collection("queueentries").find({ sessionId: { $in: todaySessionIds } }).toArray()
      : [];

    const expectedWaits = todayEntries
      .filter((e) => e.calledAt && e.joinedAt && e.calledAt >= e.joinedAt)
      .map((e) => e.calledAt.getTime() - e.joinedAt.getTime());
    const expectedServices = todayEntries
      .filter((e) => e.calledAt && e.completedAt && e.completedAt >= e.calledAt)
      .map((e) => e.completedAt.getTime() - e.calledAt.getTime());

    const summary = await callTool(tokenRO, "get_today_summary", {}, negotiated);
    check("read scope can call get_today_summary", summary.ok, summary.text.slice(0, 200));
    check("summary reports today's date in the business timezone", summary.sc?.date === dateKey(0) && summary.sc?.timezone === TIMEZONE, `${summary.sc?.date} ${summary.sc?.timezone}`);
    check(
      "summary queue counts match the database",
      summary.sc?.queues?.total === ownerQueues.length &&
        summary.sc?.queues?.active === ownerQueues.filter((q) => q.status === "active").length &&
        summary.sc?.queues?.withSessionToday === todaySessions.length,
      JSON.stringify(summary.sc?.queues),
    );
    check(
      "summary customer counts match the database",
      summary.sc?.customers?.total === todayEntries.length &&
        summary.sc?.customers?.waiting === todayEntries.filter((e) => e.status === "waiting").length &&
        summary.sc?.customers?.completed === todayEntries.filter((e) => e.status === "completed").length,
      JSON.stringify(summary.sc?.customers),
    );
    check(
      "summary averages match a JavaScript recomputation",
      summary.sc?.averageWaitTimeMs === average(expectedWaits) &&
        summary.sc?.averageServiceTimeMs === average(expectedServices),
      `mcp=${summary.sc?.averageWaitTimeMs}/${summary.sc?.averageServiceTimeMs} expected=${average(expectedWaits)}/${average(expectedServices)}`,
    );

    // An identity smuggled into the arguments must be ignored: the tool takes
    // no input, so there is nothing for the client to override.
    const spoofSummary = await callTool(tokenRW, "get_today_summary", { ownerId: otherBusiness.ownerId.toString() }, negotiated);
    check(
      "get_today_summary ignores a smuggled ownerId",
      spoofSummary.ok && spoofSummary.sc?.queues?.total === ownerQueues.length,
      spoofSummary.text.slice(0, 200),
    );

    console.log("\n=== E. get_queue_statistics: exact numbers over an exact range ===");
    const queueId = analyticsQueue._id.toString();

    const exactRange = await callTool(tokenRO, "get_queue_statistics", {
      queueId,
      fromDate: threeDaysAgo,
      toDate: yesterday,
    }, negotiated);
    check("read scope can call get_queue_statistics", exactRange.ok, exactRange.text.slice(0, 200));
    check(
      "explicit range reports the days it covers",
      exactRange.sc?.range?.fromDate === threeDaysAgo && exactRange.sc?.range?.toDate === yesterday && exactRange.sc?.range?.days === 3,
      JSON.stringify(exactRange.sc?.range),
    );
    check(
      "explicit range counts both sessions",
      exactRange.sc?.sessions?.total === 2 && exactRange.sc?.sessions?.withCustomers === 2,
      JSON.stringify(exactRange.sc?.sessions),
    );
    check(
      "explicit range totals exclude the legacy sessionId-less row",
      exactRange.sc?.customers?.total === 4 &&
        exactRange.sc?.customers?.completed === 3 &&
        exactRange.sc?.customers?.waiting === 1 &&
        exactRange.sc?.customers?.serving === 0 &&
        exactRange.sc?.customers?.skipped === 0,
      JSON.stringify(exactRange.sc?.customers),
    );
    check(
      "average wait time is exact (30s/60s/120s -> 70000ms)",
      exactRange.sc?.averageWaitTimeMs === 70000,
      String(exactRange.sc?.averageWaitTimeMs),
    );
    check(
      "average service time is exact (60s/180s/180s -> 140000ms)",
      exactRange.sc?.averageServiceTimeMs === 140000,
      String(exactRange.sc?.averageServiceTimeMs),
    );

    const singleDay = await callTool(tokenRO, "get_queue_statistics", {
      queueId,
      fromDate: yesterday,
      toDate: yesterday,
    }, negotiated);
    check(
      "a single-day range reports exactly that day",
      singleDay.ok && singleDay.sc?.range?.days === 1 && singleDay.sc?.sessions?.total === 1,
      JSON.stringify(singleDay.sc?.range),
    );
    check(
      "single-day totals match the seeded day",
      singleDay.sc?.customers?.total === 3 && singleDay.sc?.customers?.completed === 2,
      JSON.stringify(singleDay.sc?.customers),
    );
    check(
      "single-day averages are exact (90000ms wait, 180000ms service)",
      singleDay.sc?.averageWaitTimeMs === 90000 && singleDay.sc?.averageServiceTimeMs === 180000,
      `${singleDay.sc?.averageWaitTimeMs}/${singleDay.sc?.averageServiceTimeMs}`,
    );

    const defaults = await callTool(tokenRO, "get_queue_statistics", { queueId }, negotiated);
    check("omitting both dates falls back to a default range", defaults.ok, defaults.text.slice(0, 200));
    check(
      "default range ends today and spans 30 days",
      defaults.sc?.range?.toDate === dateKey(0) && defaults.sc?.range?.days === 30,
      JSON.stringify(defaults.sc?.range),
    );
    check(
      "default range includes today's session too",
      defaults.sc?.sessions?.total === 3 && defaults.sc?.customers?.total === 5 && defaults.sc?.customers?.waiting === 2,
      JSON.stringify({ sessions: defaults.sc?.sessions, customers: defaults.sc?.customers }),
    );
    check(
      "today's uncalled customer contributes no wait or service average",
      defaults.sc?.averageWaitTimeMs === 70000 && defaults.sc?.averageServiceTimeMs === 140000,
      `${defaults.sc?.averageWaitTimeMs}/${defaults.sc?.averageServiceTimeMs}`,
    );

    const noSessions = await callTool(tokenRO, "get_queue_statistics", { queueId: freshQueue._id.toString() }, negotiated);
    check(
      "a queue with no sessions reports zeroes, not an error",
      noSessions.ok && noSessions.sc?.customers?.total === 0 && noSessions.sc?.sessions?.total === 0,
      noSessions.text.slice(0, 200),
    );
    check(
      "no sessions means null averages rather than zero",
      noSessions.ok && noSessions.sc?.averageWaitTimeMs === null && noSessions.sc?.averageServiceTimeMs === null,
      `${noSessions.sc?.averageWaitTimeMs}/${noSessions.sc?.averageServiceTimeMs}`,
    );

    console.log("\n=== F. get_queue_statistics: rejected inputs ===");
    const invalidCases = [
      ["a future toDate", { fromDate: yesterday, toDate: dateKey(1) }, /toDate cannot be in the future/],
      ["a future fromDate", { fromDate: dateKey(1), toDate: yesterday }, /fromDate cannot be in the future/],
      ["a backwards range", { fromDate: yesterday, toDate: threeDaysAgo }, /fromDate must not be after toDate/],
      ["a range longer than 92 days", { fromDate: dateKey(-200), toDate: dateKey(-1) }, /cannot exceed 92 days/],
      ["an impossible calendar date", { fromDate: "2025-02-30", toDate: yesterday }, /Invalid fromDate/],
      ["a malformed date", { fromDate: "2025/02/01", toDate: yesterday }, null],
    ];
    for (const [label, range, pattern] of invalidCases) {
      const r = await callTool(tokenRO, "get_queue_statistics", { queueId, ...range }, negotiated);
      check(
        `statistics rejects ${label}`,
        r.ok === false && (pattern === null || pattern.test(r.text)),
        r.text.slice(0, 200),
      );
    }

    const statsBadId = await callTool(tokenRO, "get_queue_statistics", { queueId: "not-an-object-id" }, negotiated);
    check("statistics rejects an invalid queueId", statsBadId.ok === false && /Invalid queueId/.test(statsBadId.text), statsBadId.text.slice(0, 160));

    const missingId = new ObjectId().toString();
    const statsMissing = await callTool(tokenRO, "get_queue_statistics", { queueId: missingId }, negotiated);
    check("statistics hides queues that do not exist", statsMissing.ok === false && /Queue not found/.test(statsMissing.text), statsMissing.text.slice(0, 160));

    const statsForeign = await callTool(tokenRO, "get_queue_statistics", {
      queueId: otherQueue._id.toString(),
      ownerId: business.ownerId.toString(),
      businessId: business._id.toString(),
    }, negotiated);
    check(
      "statistics cannot read another business's queue",
      statsForeign.ok === false && /Queue not found/.test(statsForeign.text),
      statsForeign.text.slice(0, 160),
    );
    check(
      "a foreign queue reports the same thing as a missing one",
      statsForeign.text.trim() === statsMissing.text.trim(),
      `${statsForeign.text.slice(0, 80)} vs ${statsMissing.text.slice(0, 80)}`,
    );

    // Ownership is checked before the range is even considered, so a range that
    // is syntactically fine but semantically impossible still cannot be used to
    // probe for queues the caller does not own.
    const statsForeignBadDate = await callTool(tokenRO, "get_queue_statistics", {
      queueId: otherQueue._id.toString(),
      fromDate: "2099-01-01",
      toDate: "2099-01-01",
    }, negotiated);
    check(
      "ownership is proven before dates are even parsed",
      statsForeignBadDate.ok === false && /Queue not found/.test(statsForeignBadDate.text),
      statsForeignBadDate.text.slice(0, 160),
    );

    console.log("\n=== G. get_queue_history ===");
    const history = await callTool(tokenRO, "get_queue_history", { queueId, limit: 10 }, negotiated);
    check("read scope can call get_queue_history", history.ok, history.text.slice(0, 200));
    check(
      "history covers past days only, newest first, and skips today",
      Array.isArray(history.sc?.days) &&
        history.sc.days.length === 2 &&
        history.sc.days[0].date === yesterday &&
        history.sc.days[1].date === threeDaysAgo,
      JSON.stringify((history.sc?.days ?? []).map((d) => d.date)),
    );
    check(
      "history echoes the limit it honoured",
      history.sc?.limit === 10,
      String(history.sc?.limit),
    );
    check(
      "history day totals match the seeded day",
      history.sc?.days?.[0]?.customers?.total === 3 &&
        history.sc?.days?.[0]?.customers?.completed === 2 &&
        history.sc?.days?.[0]?.customers?.waiting === 1,
      JSON.stringify(history.sc?.days?.[0]?.customers),
    );
    check(
      "history day averages are exact",
      history.sc?.days?.[0]?.averageWaitTimeMs === 90000 &&
        history.sc?.days?.[0]?.averageServiceTimeMs === 180000 &&
        history.sc?.days?.[1]?.averageWaitTimeMs === 30000 &&
        history.sc?.days?.[1]?.averageServiceTimeMs === 60000,
      JSON.stringify((history.sc?.days ?? []).map((d) => [d.averageWaitTimeMs, d.averageServiceTimeMs])),
    );
    check(
      "history excludes the sessionId-less legacy row",
      history.sc?.days?.[1]?.customers?.total === 1,
      JSON.stringify(history.sc?.days?.[1]?.customers),
    );
    check(
      "history dates are ISO serialised",
      typeof history.sc?.days?.[0]?.startedAt === "string" && history.sc.days[0].startedAt !== null,
      String(history.sc?.days?.[0]?.startedAt),
    );

    const capped = await callTool(tokenRO, "get_queue_history", { queueId, limit: 1 }, negotiated);
    check("history honours limit=1", capped.ok && capped.sc?.days?.length === 1 && capped.sc.days[0].date === yesterday, JSON.stringify(capped.sc?.days));

    const defaulted = await callTool(tokenRO, "get_queue_history", { queueId }, negotiated);
    check("omitting limit uses the default of 30", defaulted.ok && defaulted.sc?.limit === 30 && defaulted.sc?.days?.length === 2, String(defaulted.sc?.limit));

    const historyEmpty = await callTool(tokenRO, "get_queue_history", { queueId: freshQueue._id.toString() }, negotiated);
    check("a queue with no history reports an empty list", historyEmpty.ok && Array.isArray(historyEmpty.sc?.days) && historyEmpty.sc.days.length === 0, historyEmpty.text.slice(0, 200));

    const limitCases = [
      ["limit=0", 0],
      ["a limit above 100", 101],
      ["a fractional limit", 2.5],
    ];
    for (const [label, limit] of limitCases) {
      const r = await callTool(tokenRO, "get_queue_history", { queueId, limit }, negotiated);
      check(`history rejects ${label}`, r.ok === false, r.text.slice(0, 160));
    }

    const historyBadId = await callTool(tokenRO, "get_queue_history", { queueId: "not-an-object-id" }, negotiated);
    check("history rejects an invalid queueId", historyBadId.ok === false && /Invalid queueId/.test(historyBadId.text), historyBadId.text.slice(0, 160));

    const historyMissing = await callTool(tokenRO, "get_queue_history", { queueId: missingId }, negotiated);
    check("history hides queues that do not exist", historyMissing.ok === false && /Queue not found/.test(historyMissing.text), historyMissing.text.slice(0, 160));

    const historyForeign = await callTool(tokenRO, "get_queue_history", {
      queueId: otherQueue._id.toString(),
      ownerId: business.ownerId.toString(),
      businessId: business._id.toString(),
    }, negotiated);
    check(
      "history cannot read another business's queue",
      historyForeign.ok === false && /Queue not found/.test(historyForeign.text),
      historyForeign.text.slice(0, 160),
    );
    check(
      "a foreign queue's history reports the same thing as a missing one's",
      historyForeign.text.trim() === historyMissing.text.trim(),
      `${historyForeign.text.slice(0, 80)} vs ${historyMissing.text.slice(0, 80)}`,
    );

    console.log("\n=== H. read-only: no writes, no PII ===");
    const otherBefore = await app.collection("queues").findOne({ _id: otherQueue._id });
    const analyticsBefore = await app.collection("queues").findOne({ _id: analyticsQueue._id });
    const freshSessionsBefore = await app.collection("queuesessions").countDocuments({ queueId: freshQueue._id });
    const analyticsSessionsBefore = await app.collection("queuesessions").countDocuments({ queueId: analyticsQueue._id });
    const analyticsEntriesBefore = await app.collection("queueentries").countDocuments({ queueId: analyticsQueue._id });
    const queuesBefore = await app.collection("queues").countDocuments({ businessId: business._id });
    const sessionsBefore = await app.collection("queuesessions").countDocuments({ queueId: { $in: ownerQueueIds } });

    const payloads = [];
    payloads.push((await callTool(tokenRW, "get_today_summary", {}, negotiated)).text);
    payloads.push((await callTool(tokenRW, "get_queue_statistics", { queueId, fromDate: threeDaysAgo, toDate: dateKey(0) }, negotiated)).text);
    payloads.push((await callTool(tokenRW, "get_queue_history", { queueId, limit: 30 }, negotiated)).text);
    payloads.push((await callTool(tokenRW, "get_queue_statistics", { queueId: freshQueue._id.toString() }, negotiated)).text);
    payloads.push((await callTool(tokenRW, "get_queue_history", { queueId: freshQueue._id.toString() }, negotiated)).text);

    check(
      "analytics created no session for a session-less queue",
      (await app.collection("queuesessions").countDocuments({ queueId: freshQueue._id })) === freshSessionsBefore,
      String(await app.collection("queuesessions").countDocuments({ queueId: freshQueue._id })),
    );
    check(
      "analytics created no extra session for a queue that has one",
      (await app.collection("queuesessions").countDocuments({ queueId: analyticsQueue._id })) === analyticsSessionsBefore,
      String(await app.collection("queuesessions").countDocuments({ queueId: analyticsQueue._id })),
    );
    check(
      "analytics created no entries",
      (await app.collection("queueentries").countDocuments({ queueId: analyticsQueue._id })) === analyticsEntriesBefore,
      String(await app.collection("queueentries").countDocuments({ queueId: analyticsQueue._id })),
    );
    check(
      "analytics created no queues",
      (await app.collection("queues").countDocuments({ businessId: business._id })) === queuesBefore,
      String(await app.collection("queues").countDocuments({ businessId: business._id })),
    );
    check(
      "analytics created no sessions anywhere in the business",
      (await app.collection("queuesessions").countDocuments({ queueId: { $in: ownerQueueIds } })) === sessionsBefore,
      String(await app.collection("queuesessions").countDocuments({ queueId: { $in: ownerQueueIds } })),
    );

    const analyticsAfter = await app.collection("queues").findOne({ _id: analyticsQueue._id });
    check(
      "analytics left the queue document untouched",
      String(analyticsAfter?.updatedAt) === String(analyticsBefore?.updatedAt) &&
        analyticsAfter?.currentToken === analyticsBefore?.currentToken &&
        analyticsAfter?.status === analyticsBefore?.status,
      `${analyticsBefore?.currentToken}/${analyticsBefore?.status} -> ${analyticsAfter?.currentToken}/${analyticsAfter?.status}`,
    );

    const otherAfter = await app.collection("queues").findOne({ _id: otherQueue._id });
    check(
      "another business's queue document untouched",
      String(otherAfter?.updatedAt) === String(otherBefore?.updatedAt),
      `${String(otherBefore?.updatedAt)} -> ${String(otherAfter?.updatedAt)}`,
    );
    check(
      "no session or entry was created for the other queue",
      (await app.collection("queuesessions").countDocuments({ queueId: otherQueue._id })) === 0 &&
        (await app.collection("queueentries").countDocuments({ queueId: otherQueue._id })) === 0,
      "",
    );

    const joinedPayload = payloads.join("\n");
    check(
      "analytics output never contains a customer name",
      !/PII-Customer/.test(joinedPayload),
      joinedPayload.slice(0, 200),
    );
    check(
      "analytics output has no customerName field at all",
      !/"customerName"/.test(joinedPayload),
      joinedPayload.slice(0, 200),
    );
    check(
      "analytics output is real JSON in every payload",
      payloads.every((p) => { try { JSON.parse(p); return true; } catch { return false; } }),
      "",
    );

    console.log("\n=== I. unexpected errors stay generic ===");
    await app.collection("businesses").updateOne({ _id: business._id }, { $set: { timezone: "Not/AZone" } });
    try {
      const boom = await callTool(tokenRW, "get_today_summary", {}, negotiated);
      check("unexpected error becomes a generic tool error", boom.ok === false && boom.sc?.error === "Failed to read queue data.", boom.text.slice(0, 200));
      check(
        "unexpected error leaks no internals",
        !/RangeError|Not\/AZone|time zone|Invalid time|at \w+ \(|\.ts:\d|node_modules|stack/i.test(boom.text),
        boom.text.slice(0, 240),
      );
    } finally {
      await app.collection("businesses").updateOne({ _id: business._id }, { $set: { timezone: TIMEZONE } });
    }
  } finally {
    console.log("\n=== cleanup ===");
    try {
      if (createdIds.queues.length) {
        const ids = createdIds.queues.filter(Boolean);
        await app.collection("queueentries").deleteMany({ queueId: { $in: ids } });
        await app.collection("queuesessions").deleteMany({ queueId: { $in: ids } });
        await app.collection("queues").deleteMany({ _id: { $in: ids } });
      }
      if (createdIds.businesses.length) {
        await app.collection("queues").deleteMany({ businessId: { $in: createdIds.businesses } });
        await app.collection("businesses").deleteMany({ _id: { $in: createdIds.businesses } });
      }
      if (businessCreated && business?._id) {
        // Anything still under this business is a stray from a previous attempt.
        const leftovers = (await app.collection("queues").find({ businessId: business._id }).toArray()).map((q) => q._id);
        if (leftovers.length) {
          await app.collection("queueentries").deleteMany({ queueId: { $in: leftovers } });
          await app.collection("queuesessions").deleteMany({ queueId: { $in: leftovers } });
          await app.collection("queues").deleteMany({ businessId: business._id });
        }
        await app.collection("businesses").deleteOne({ _id: business._id });
      }
      console.log("  fixtures removed (test user and pre-existing data left alone)");
    } catch (err) {
      console.error("  cleanup error:", err.message);
    }
    await mongo.close();
  }

  process.exit(harness.summary());
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
