// Stage 2 end-to-end test for the Qzen MCP write tools (local).
//
// Runs the real OAuth flow against the running server and exercises the five
// write tools plus the refactored HTTP routes:
//   - authenticated owner can perform each permitted mutation
//   - another business's queue cannot be mutated (and reports nothing about it)
//   - invalid queueId / invalid inputs / invalid state transitions rejected
//   - mcp:read cannot invoke write tools, mcp:write can
//   - unexpected errors return a generic message with no internals
//   - Stage 1 read tools are unchanged and still never create sessions
//
// Requires: the server running on BASE_URL, MONGODB_URI set (and .env.local).
//   npm start
//   npm run test:mcp
import { MongoClient, ObjectId } from "mongodb";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RESOURCE = `${BASE}/api/mcp`;
const REDIRECT_URI = "http://localhost:6274/oauth/callback";
const TEST_EMAIL = process.env.TEST_EMAIL ?? "mcp-oauth-test@qzen.local";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "McpOAuthTest123!";

const READ_TOOLS = [
  "list_queues",
  "get_queue_status",
  "get_waiting_customers",
  "get_queue_session",
];
const WRITE_TOOLS = [
  "create_queue",
  "update_queue_status",
  "call_next_customer",
  "complete_current_customer",
  "skip_current_customer",
];

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

class CookieJar {
  constructor() { this.cookies = new Map(); }
  store(response) {
    const setCookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
    for (const line of setCookies) {
      const [pair] = line.split(";");
      const idx = pair.indexOf("=");
      if (idx < 0) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      const expired = /Expires=Thu, 01 Jan 1970/i.test(line) || value === "";
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  clear() { this.cookies.clear(); }
}

const jar = new CookieJar();

async function req(url, { method = "GET", headers = {}, body, jar: useJar = true, redirect = "manual" } = {}) {
  const h = { ...headers };
  if (useJar && jar.header()) h.cookie = jar.header();
  const response = await fetch(url, { method, headers: h, body, redirect });
  if (useJar) jar.store(response);
  return response;
}

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

async function redirectLocation(response) {
  const loc = response.headers.get("location");
  if (loc) return loc;
  if (response.status >= 200 && response.status < 300) {
    const json = await readJson(response);
    if (json?.redirect && typeof json.url === "string") return json.url;
  }
  return null;
}

function parseChallenge(response) {
  const www = response.headers.get("www-authenticate") ?? "";
  return {
    www,
    resourceMetadata: /resource_metadata="([^"]+)"/.exec(www)?.[1],
    scheme: /^Bearer\s+/i.test(www),
  };
}

function buildSignedOAuthQuery(search) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!params.has("sig")) return undefined;
  const signedNames = params.getAll("ba_param");
  if (!signedNames.length) return undefined;
  const out = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key === "sig" || key === "ba_param" || signedNames.includes(key)) out.append(key, value);
  }
  return out.toString();
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

async function makePkce() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

function loginUrlResolve(loc) {
  return loc.startsWith("http") ? loc : `${BASE}${loc}`;
}

async function startAuthorize(clientId, scope) {
  const { verifier, challenge } = await makePkce();
  const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
  const url = new URL(`${BASE}/api/auth/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", RESOURCE);
  const res = await req(url.toString(), {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      "sec-fetch-site": "none",
    },
  });
  return { res, verifier, state };
}

async function loginWithSignedQuery(loginLocation) {
  if (!loginLocation) return { error: "no login redirect location" };
  const loginUrl = new URL(loginUrlResolve(loginLocation));
  const oauthQuery = buildSignedOAuthQuery(loginUrl.search);
  if (!oauthQuery) return { error: "no signed query in login redirect" };
  const res = await req(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE, "sec-fetch-mode": "cors" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, oauth_query: oauthQuery }),
  });
  return { res, json: await readJson(res) };
}

async function postConsent(consentLocation, accept) {
  if (!consentLocation) return { error: "no consent redirect location" };
  const consentUrl = new URL(loginUrlResolve(consentLocation));
  const oauthQuery = buildSignedOAuthQuery(consentUrl.search);
  if (!oauthQuery) return { error: "no signed query in consent redirect" };
  const res = await req(`${BASE}/api/auth/oauth2/consent`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
    body: JSON.stringify({ accept, oauth_query: oauthQuery }),
  });
  return { res, json: await readJson(res) };
}

async function exchangeToken(asMeta, { code, verifier, clientId }) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
    resource: RESOURCE,
  });
  const res = await req(asMeta.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: body.toString(),
    jar: false,
  });
  return { res, json: await readJson(res) };
}

async function registerClient(asMeta, clientName) {
  const res = await req(asMeta.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: clientName,
      application_type: "native",
    }),
    jar: false,
  });
  const json = await readJson(res);
  if (res.status !== 201 || typeof json.client_id !== "string") {
    throw new Error(`DCR failed: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.client_id;
}

// Fresh client + fresh session: authorize -> login (signed oauth_query) ->
// consent -> token exchange. Returns the access token and leaves the cookie
// jar signed in as the test user (used later for the HTTP route regression).
async function getAccessToken(asMeta, scope, clientName) {
  const clientId = await registerClient(asMeta, clientName);
  jar.clear();
  const { res: authRes, verifier, state } = await startAuthorize(clientId, scope);
  const loginLoc = await redirectLocation(authRes);
  if (!loginLoc) throw new Error(`${clientName}: authorize did not redirect to login`);
  const login = await loginWithSignedQuery(loginLoc);
  if (login.json?.redirect !== true) throw new Error(`${clientName}: login did not continue: ${JSON.stringify(login.json).slice(0, 200)}`);
  const consent = await postConsent(login.json.url, true);
  if (consent.json?.redirect !== true) throw new Error(`${clientName}: consent did not redirect: ${JSON.stringify(consent.json).slice(0, 200)}`);
  const cbUrl = new URL(loginUrlResolve(consent.json.url));
  if (cbUrl.searchParams.get("state") !== state) throw new Error(`${clientName}: state mismatch`);
  const token = await exchangeToken(asMeta, {
    code: cbUrl.searchParams.get("code"),
    verifier,
    clientId,
  });
  if (!token.json?.access_token) throw new Error(`${clientName}: no access token: ${JSON.stringify(token.json).slice(0, 200)}`);
  return token.json.access_token;
}

async function callMcp(accessToken, { method, params }, protocolVersion) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${accessToken}`,
  };
  if (protocolVersion) headers["mcp-protocol-version"] = protocolVersion;
  const res = await req(RESOURCE, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random() * 1e6), method, params }),
    jar: false,
  });
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let payload = null;
  if (contentType.includes("text/event-stream")) {
    const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
    if (dataLine) { try { payload = JSON.parse(dataLine.slice(5).trim()); } catch {} }
  } else {
    try { payload = JSON.parse(text); } catch {}
  }
  return { res, payload, text: text.slice(0, 400) };
}

async function initialize(token) {
  const res = await callMcp(token, {
    method: "initialize",
    params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "stage2-e2e", version: "0.0.1" } },
  });
  return { negotiated: res.payload?.result?.protocolVersion ?? "2025-11-25", ok: !!res.payload?.result };
}

async function callTool(token, name, args, negotiated) {
  const res = await callMcp(token, { method: "tools/call", params: { name, arguments: args } }, negotiated);
  const r = res.payload?.result;
  return {
    http: res.res.status,
    ok: !!r && !r.isError,
    isError: Boolean(r?.isError),
    sc: r?.structuredContent ?? null,
    text: (r?.content ?? []).map((c) => c.text ?? "").join("\n"),
    rpcError: res.payload?.error ?? null,
  };
}

async function ensureTestUser() {
  const signUp = await req(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
    body: JSON.stringify({ name: "MCP OAuth Test", email: TEST_EMAIL, password: TEST_PASSWORD }),
    jar: false,
  });
  const signUpJson = await readJson(signUp);
  console.log(`  sign-up: ${signUp.status} ${signUpJson?.error?.code ?? signUpJson?.error?.message ?? "ok"}`);

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const r = await client.db("qzen").collection("user").updateOne(
      { email: TEST_EMAIL.toLowerCase() },
      { $set: { emailVerified: true, updatedAt: new Date() } },
    );
    console.log(`  mongo emailVerified=true: matched ${r.matchedCount}`);
  } finally {
    await client.close();
  }
}

async function discover() {
  const challenge = await req(RESOURCE, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
    jar: false,
  });
  check("unauthenticated POST /api/mcp -> 401", challenge.status === 401, `status ${challenge.status}`);
  const parsed = parseChallenge(challenge);
  check("WWW-Authenticate challenge present", parsed.scheme && !!parsed.resourceMetadata, parsed.www.slice(0, 200));
  check("challenge advertises the mcp:write scope", /mcp:write/.test(parsed.www), parsed.www.slice(0, 200));

  const prm = await readJson(await req(parsed.resourceMetadata, { headers: { accept: "application/json" }, jar: false }));
  const issuer = prm.authorization_servers[0];
  const asMeta = await readJson(
    await req(`${BASE}/.well-known/oauth-authorization-server${new URL(issuer).pathname}`, {
      headers: { accept: "application/json" },
      jar: false,
    }),
  );
  check("AS metadata discovered", !!asMeta?.registration_endpoint && !!asMeta?.token_endpoint, String(asMeta?.issuer));
  return { asMeta, parsed };
}

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
  const tokenRW = await getAccessToken(asMeta, "mcp:read mcp:write", "stage2-rw");
  const tokenRO = await getAccessToken(asMeta, "mcp:read", "stage2-ro");
  check("read+write token issued", !!tokenRW);
  check("read-only token issued", !!tokenRO);

  const initRW = await initialize(tokenRW);
  const negotiated = initRW.negotiated;
  check("initialize (read+write)", initRW.ok, `protocol ${negotiated}`);
  const initRO = await initialize(tokenRO);
  check("initialize (read-only)", initRO.ok, `protocol ${initRO.negotiated}`);

  const mongo = new MongoClient(process.env.MONGODB_URI);
  await mongo.connect();
  const authDb = mongo.db("qzen");
  const app = mongo.db("test");

  const stamp = Date.now();
  const queueIds = [];
  let business = null;
  let businessCreated = false;
  let otherBusiness = null;
  let queueA = null;
  let otherQueue = null;
  let businessOwnerId = null;

  const countQueues = (id) => app.collection("queues").countDocuments({ businessId: id });
  const countSessions = (id) => app.collection("queuesessions").countDocuments({ queueId: id });
  const countEntries = (id) => app.collection("queueentries").countDocuments({ queueId: id });

  try {
    console.log("\n=== B. fixtures ===");
    const user = await authDb.collection("user").findOne({ email: TEST_EMAIL.toLowerCase() });
    check("test user exists", !!user, String(user?._id));
    if (!user) throw new Error("aborting: no test user");

    businessOwnerId = typeof user._id === "object" ? user._id : new ObjectId(String(user._id));

    business = await app.collection("businesses").findOne({ ownerId: businessOwnerId });
    if (!business) {
      const now = new Date();
      const doc = {
        name: "Stage 2 E2E",
        ownerId: businessOwnerId,
        slug: `stage2-e2e-${stamp}`,
        timezone: "Asia/Kolkata",
        createdAt: now,
        updatedAt: now,
      };
      const r = await app.collection("businesses").insertOne(doc);
      business = { ...doc, _id: r.insertedId };
      businessCreated = true;
    }
    check("owner business available", !!business, businessCreated ? "created by this run" : "pre-existing");

    const now = new Date();
    const queueAInsert = await app.collection("queues").insertOne({
      businessId: business._id,
      name: "Stage 2 Main",
      slug: `stage2-main-${stamp}`,
      status: "active",
      currentToken: 0,
      averageServiceTime: 10,
      createdAt: now,
      updatedAt: now,
    });
    queueA = { _id: queueAInsert.insertedId };
    queueIds.push(queueA._id);

    const otherOwnerId = new ObjectId();
    const otherBusinessInsert = await app.collection("businesses").insertOne({
      name: "Someone Else",
      ownerId: otherOwnerId,
      slug: `stage2-other-${stamp}`,
      timezone: "Asia/Kolkata",
      createdAt: now,
      updatedAt: now,
    });
    otherBusiness = { _id: otherBusinessInsert.insertedId, ownerId: otherOwnerId };

    const otherQueueInsert = await app.collection("queues").insertOne({
      businessId: otherBusiness._id,
      name: "Someone Else's Queue",
      slug: `stage2-other-queue-${stamp}`,
      status: "active",
      currentToken: 0,
      averageServiceTime: 10,
      createdAt: now,
      updatedAt: now,
    });
    otherQueue = { _id: otherQueueInsert.insertedId };

    const otherBefore = await app.collection("queues").findOne({ _id: otherQueue._id });
    check("fixtures ready", !!queueA?._id && !!otherQueue?._id, `queueA=${queueA._id} other=${otherQueue._id}`);

    console.log("\n=== C. tools/list and annotations ===");
    const tools = await callMcp(tokenRW, { method: "tools/list", params: {} }, negotiated);
    const list = tools.payload?.result?.tools ?? [];
    const byName = Object.fromEntries(list.map((t) => [t.name, t]));
    const expected = ["ping_qzen", ...READ_TOOLS, ...WRITE_TOOLS];
    check(
      "tools/list exposes ping + 4 read + 5 write tools",
      expected.every((n) => !!byName[n]),
      JSON.stringify(list.map((t) => t.name)),
    );
    const ann = (n) => byName[n]?.annotations ?? {};
    check("create_queue not read-only", ann("create_queue").readOnlyHint === false, JSON.stringify(ann("create_queue")));
    check("create_queue additive + not idempotent", ann("create_queue").destructiveHint === false && ann("create_queue").idempotentHint === false, JSON.stringify(ann("create_queue")));
    check("update_queue_status not read-only, non-destructive, idempotent", ann("update_queue_status").readOnlyHint === false && ann("update_queue_status").destructiveHint === false && ann("update_queue_status").idempotentHint === true, JSON.stringify(ann("update_queue_status")));
    check("call_next_customer not read-only, not idempotent", ann("call_next_customer").readOnlyHint === false && ann("call_next_customer").idempotentHint === false, JSON.stringify(ann("call_next_customer")));
    check("complete_current_customer destructive + not idempotent", ann("complete_current_customer").readOnlyHint === false && ann("complete_current_customer").destructiveHint === true && ann("complete_current_customer").idempotentHint === false, JSON.stringify(ann("complete_current_customer")));
    check("skip_current_customer destructive + not idempotent", ann("skip_current_customer").readOnlyHint === false && ann("skip_current_customer").destructiveHint === true && ann("skip_current_customer").idempotentHint === false, JSON.stringify(ann("skip_current_customer")));
    check("Stage 1 read tools still read-only", READ_TOOLS.every((n) => ann(n).readOnlyHint === true), READ_TOOLS.map((n) => `${n}:${ann(n).readOnlyHint}`).join(" "));
    check("update_queue_status schema exposes queueId + status", !!byName.update_queue_status?.inputSchema?.properties?.queueId && !!byName.update_queue_status?.inputSchema?.properties?.status, JSON.stringify(byName.update_queue_status?.inputSchema?.properties));

    console.log("\n=== D. create_queue ===");
    const queuesBefore = await countQueues(business._id);
    const created = await callTool(tokenRW, "create_queue", { name: "Stage 2 Created", slug: `stage2-created-${stamp}` }, negotiated);
    check("owner can create a queue", created.ok, created.text.slice(0, 200));
    check("create_queue returns the created queue", created.sc?.queue?.name === "Stage 2 Created" && created.sc?.queue?.slug === `stage2-created-${stamp}`, JSON.stringify(created.sc));
    const mcpQueueId = created.sc?.queue?.id;
    const createdDoc = mcpQueueId && (await app.collection("queues").findOne({ _id: new ObjectId(mcpQueueId) }));
    check("created queue belongs to the authenticated business", !!createdDoc && String(createdDoc.businessId) === String(business._id), `${createdDoc?.businessId} vs ${business._id}`);
    check("queue count incremented by exactly one", (await countQueues(business._id)) === queuesBefore + 1, `${queuesBefore} -> ${await countQueues(business._id)}`);
    if (mcpQueueId) queueIds.push(new ObjectId(mcpQueueId));

    const spoofed = await callTool(tokenRW, "create_queue", {
      name: "Spoof attempt",
      slug: `stage2-spoof-${stamp}`,
      businessId: otherBusiness._id.toString(),
      ownerId: otherBusiness.ownerId.toString(),
    }, negotiated);
    check("create_queue cannot be pointed at another business", spoofed.ok, spoofed.text.slice(0, 200));
    const spoofDoc = await app.collection("queues").findOne({ slug: `stage2-spoof-${stamp}` });
    check("client-supplied businessId/ownerId are ignored", !!spoofDoc && String(spoofDoc.businessId) === String(business._id), `${spoofDoc?.businessId} vs ${business._id}`);
    if (spoofDoc?._id) queueIds.push(spoofDoc._id);

    const noSlug = await callTool(tokenRW, "create_queue", { name: "No slug" }, negotiated);
    check("create_queue without slug rejected", noSlug.ok === false, noSlug.text.slice(0, 200));
    const emptySlug = await callTool(tokenRW, "create_queue", { name: "Empty slug", slug: "" }, negotiated);
    check("create_queue with empty slug rejected", emptySlug.ok === false, emptySlug.text.slice(0, 200));
    const wrongType = await callTool(tokenRW, "create_queue", { name: 123, slug: "wrong-type" }, negotiated);
    check("create_queue with non-string name rejected", wrongType.ok === false, wrongType.text.slice(0, 200));
    check("rejected create_queue calls created no queues", (await countQueues(business._id)) === queuesBefore + 2, `${queuesBefore} -> ${await countQueues(business._id)}`);

    console.log("\n=== E. Stage 1 read tools unchanged (and still non-creating) ===");
    const lq = await callTool(tokenRO, "list_queues", {}, negotiated);
    check("read token can still call list_queues", lq.ok && Array.isArray(lq.sc?.queues), `${lq.sc?.count} queues`);
    check("list_queues sees the queue created through MCP", (lq.sc?.queues ?? []).some((q) => q.id === mcpQueueId), JSON.stringify((lq.sc?.queues ?? []).map((q) => q.slug)));

    const gs = await callTool(tokenRO, "get_queue_session", { queueId: mcpQueueId }, negotiated);
    check("get_queue_session reports a missing session", gs.ok && gs.sc?.exists === false && gs.sc?.session === null, JSON.stringify(gs.sc));
    check("read tool created no session", (await countSessions(new ObjectId(mcpQueueId))) === 0, String(await countSessions(new ObjectId(mcpQueueId))));

    const stat = await callTool(tokenRO, "get_queue_status", { queueId: mcpQueueId }, negotiated);
    check("get_queue_status unchanged", stat.ok && stat.sc?.queue?.id === mcpQueueId && "dateKey" in (stat.sc ?? {}) && "waitingCount" in (stat.sc ?? {}), JSON.stringify(stat.sc));

    const wcEmpty = await callTool(tokenRO, "get_waiting_customers", { queueId: mcpQueueId }, negotiated);
    check("get_waiting_customers unchanged", wcEmpty.ok && wcEmpty.sc?.count === 0 && Array.isArray(wcEmpty.sc?.customers), JSON.stringify(wcEmpty.sc));

    console.log("\n=== F. update_queue_status ===");
    const badStatus = await callTool(tokenRW, "update_queue_status", { queueId: mcpQueueId, status: "bogus" }, negotiated);
    check("invalid status rejected with the API message", badStatus.ok === false && /Invalid queue status/.test(badStatus.text), badStatus.text.slice(0, 200));
    check("rejected status change created no session", (await countSessions(new ObjectId(mcpQueueId))) === 0, String(await countSessions(new ObjectId(mcpQueueId))));

    const badId = await callTool(tokenRW, "update_queue_status", { queueId: "not-an-object-id", status: "active" }, negotiated);
    check("invalid queueId rejected", badId.ok === false && /Invalid queueId/.test(badId.text), badId.text.slice(0, 200));

    const spoofStatus = await callTool(tokenRW, "update_queue_status", {
      queueId: otherQueue._id.toString(),
      status: "paused",
      ownerId: businessOwnerId.toString(),
    }, negotiated);
    check("client-supplied ownerId cannot reach another business's queue", spoofStatus.ok === false && /Queue not found/.test(spoofStatus.text), spoofStatus.text.slice(0, 200));

    const paused = await callTool(tokenRW, "update_queue_status", { queueId: mcpQueueId, status: "paused" }, negotiated);
    check("owner can pause a queue", paused.ok && paused.sc?.queue?.status === "paused", JSON.stringify(paused.sc));
    check("status change mirrors onto today's session", paused.sc?.session?.status === "paused", JSON.stringify(paused.sc?.session));

    const resumed = await callTool(tokenRW, "update_queue_status", { queueId: mcpQueueId, status: "active" }, negotiated);
    check("owner can resume a queue", resumed.ok && resumed.sc?.queue?.status === "active" && resumed.sc?.session?.status === "active", JSON.stringify(resumed.sc));

    console.log("\n=== G. call_next / complete / skip (MCP-only workflow) ===");
    const started = await callTool(tokenRW, "update_queue_status", { queueId: queueA._id.toString(), status: "active" }, negotiated);
    check("queue started from MCP (session created once)", started.ok && started.sc?.session?.status === "active", started.text.slice(0, 200));
    const sessionId = started.sc?.session?.id;
    check("exactly one session exists for the queue", (await countSessions(queueA._id)) === 1, String(await countSessions(queueA._id)));

    if (sessionId) {
      const now = new Date();
      await app.collection("queueentries").insertMany([1, 2, 3].map((n) => ({
        queueId: queueA._id,
        sessionId: new ObjectId(sessionId),
        tokenNumber: n,
        customerName: `Customer ${n}`,
        status: "waiting",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })));
    }
    check("seeded three waiting customers", (await countEntries(queueA._id)) === 3, String(await countEntries(queueA._id)));

    const wc = await callTool(tokenRO, "get_waiting_customers", { queueId: queueA._id.toString() }, negotiated);
    check("Stage 1 read still lists waiting customers in order", wc.ok && wc.sc?.count === 3 && (wc.sc?.customers ?? []).map((c) => c.tokenNumber).join(",") === "1,2,3", JSON.stringify(wc.sc));

    const n1 = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("call_next serves the lowest token", n1.ok && n1.sc?.entry?.tokenNumber === 1 && n1.sc?.entry?.status === "serving", JSON.stringify(n1.sc?.entry));
    check("call_next returns queue + session + entry", !!n1.sc?.queue && !!n1.sc?.session && !!n1.sc?.entry, JSON.stringify(Object.keys(n1.sc ?? {})));
    check("call_next advances the session's currentToken", n1.sc?.session?.currentToken === 1, String(n1.sc?.session?.currentToken));

    const n2 = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("call_next refused while a customer is served", n2.ok === false && /A customer is already being served/.test(n2.text), n2.text.slice(0, 200));
    check("refused call_next served nobody", (await countEntries(queueA._id)) === 3, String(await countEntries(queueA._id)));

    const c1 = await callTool(tokenRW, "complete_current_customer", { queueId: queueA._id.toString() }, negotiated);
    check("complete finishes the served customer", c1.ok && c1.sc?.entry?.tokenNumber === 1 && c1.sc?.entry?.status === "completed", JSON.stringify(c1.sc?.entry));
    const c2 = await callTool(tokenRW, "complete_current_customer", { queueId: queueA._id.toString() }, negotiated);
    check("complete with nobody served rejected", c2.ok === false && /No customer is currently being served/.test(c2.text), c2.text.slice(0, 200));

    const n3 = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("next call serves token 2", n3.ok && n3.sc?.entry?.tokenNumber === 2 && n3.sc?.entry?.status === "serving", JSON.stringify(n3.sc?.entry));

    const s1 = await callTool(tokenRW, "skip_current_customer", { queueId: queueA._id.toString() }, negotiated);
    check("skip marks the served customer skipped", s1.ok && s1.sc?.entry?.tokenNumber === 2 && s1.sc?.entry?.status === "skipped", JSON.stringify(s1.sc?.entry));
    const s2 = await callTool(tokenRW, "skip_current_customer", { queueId: queueA._id.toString() }, negotiated);
    check("skip with nobody served rejected", s2.ok === false && /No customer is currently being served/.test(s2.text), s2.text.slice(0, 200));

    const n4 = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("next call serves token 3", n4.ok && n4.sc?.entry?.tokenNumber === 3 && n4.sc?.entry?.status === "serving", JSON.stringify(n4.sc?.entry));
    const c3 = await callTool(tokenRW, "complete_current_customer", { queueId: queueA._id.toString() }, negotiated);
    check("complete clears the last customer", c3.ok && c3.sc?.entry?.status === "completed", JSON.stringify(c3.sc?.entry));
    const n5 = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("call_next with nobody waiting rejected", n5.ok === false && /No customers waiting/.test(n5.text), n5.text.slice(0, 200));

    const finalStates = await app.collection("queueentries").find({ queueId: queueA._id }).sort({ tokenNumber: 1 }).toArray();
    check("entry states persisted as completed / skipped / completed", finalStates.map((e) => e.status).join(",") === "completed,skipped,completed", finalStates.map((e) => `${e.tokenNumber}:${e.status}`).join(","));

    const closed = await callTool(tokenRW, "update_queue_status", { queueId: queueA._id.toString(), status: "closed" }, negotiated);
    check("queue can be closed from MCP", closed.ok && closed.sc?.session?.status === "closed", closed.text.slice(0, 200));
    const nClosed = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
    check("call_next on a closed queue rejected", nClosed.ok === false && /This queue is closed/.test(nClosed.text), nClosed.text.slice(0, 200));
    await callTool(tokenRW, "update_queue_status", { queueId: queueA._id.toString(), status: "active" }, negotiated);

    console.log("\n=== H. ownership + invalid ids across all write tools ===");
    const foreignId = otherQueue._id.toString();
    const foreignCases = [
      ["update_queue_status", { queueId: foreignId, status: "paused" }],
      ["call_next_customer", { queueId: foreignId }],
      ["complete_current_customer", { queueId: foreignId }],
      ["skip_current_customer", { queueId: foreignId }],
    ];
    for (const [name, args] of foreignCases) {
      const r = await callTool(tokenRW, name, args, negotiated);
      check(`${name} cannot touch another business's queue`, r.ok === false && /Queue not found/.test(r.text), r.text.slice(0, 160));
    }
    const missingId = new ObjectId().toString();
    const missingCases = [
      ["update_queue_status", { queueId: missingId, status: "paused" }],
      ["call_next_customer", { queueId: missingId }],
      ["complete_current_customer", { queueId: missingId }],
      ["skip_current_customer", { queueId: missingId }],
    ];
    for (const [name, args] of missingCases) {
      const r = await callTool(tokenRW, name, args, negotiated);
      check(`${name} hides queues that do not exist`, r.ok === false && /Queue not found/.test(r.text), r.text.slice(0, 160));
    }
    const invalidIdCases = [
      ["update_queue_status", { queueId: "not-an-object-id", status: "paused" }],
      ["call_next_customer", { queueId: "not-an-object-id" }],
      ["complete_current_customer", { queueId: "not-an-object-id" }],
      ["skip_current_customer", { queueId: "not-an-object-id" }],
    ];
    for (const [name, args] of invalidIdCases) {
      const r = await callTool(tokenRW, name, args, negotiated);
      check(`${name} rejects an invalid queueId`, r.ok === false && /Invalid queueId/.test(r.text), r.text.slice(0, 160));
    }

    const otherAfter = await app.collection("queues").findOne({ _id: otherQueue._id });
    check("other business's queue document untouched", String(otherAfter?.updatedAt) === String(otherBefore?.updatedAt) && otherAfter?.status === otherBefore.status, `${otherBefore?.status}/${String(otherBefore?.updatedAt)} -> ${otherAfter?.status}/${String(otherAfter?.updatedAt)}`);
    check("no session created for the other queue", (await countSessions(otherQueue._id)) === 0, String(await countSessions(otherQueue._id)));
    check("no entries created for the other queue", (await countEntries(otherQueue._id)) === 0, String(await countEntries(otherQueue._id)));

    console.log("\n=== I. scope enforcement (mcp:read vs mcp:write) ===");
    const queueABefore = await app.collection("queues").findOne({ _id: queueA._id });
    const roCases = [
      ["create_queue", { name: "Read only attempt", slug: `stage2-readonly-${stamp}` }],
      ["update_queue_status", { queueId: queueA._id.toString(), status: "paused" }],
      ["call_next_customer", { queueId: queueA._id.toString() }],
      ["complete_current_customer", { queueId: queueA._id.toString() }],
      ["skip_current_customer", { queueId: queueA._id.toString() }],
    ];
    for (const [name, args] of roCases) {
      const r = await callTool(tokenRO, name, args, negotiated);
      check(`read scope cannot invoke ${name}`, r.ok === false && /mcp:write/.test(r.text), r.text.slice(0, 160));
    }
    const queueAAfterReadOnly = await app.collection("queues").findOne({ _id: queueA._id });
    check("read-scope rejections changed nothing", String(queueAAfterReadOnly?.updatedAt) === String(queueABefore?.updatedAt) && queueAAfterReadOnly?.status === queueABefore?.status, `${queueABefore?.status} -> ${queueAAfterReadOnly?.status}`);
    check("read-scope rejections created no queues", !(await app.collection("queues").findOne({ slug: `stage2-readonly-${stamp}` })));
    check("read scope can still use read tools", (await callTool(tokenRO, "list_queues", {}, negotiated)).ok === true);
    const writeScopeOk = await callTool(tokenRW, "create_queue", { name: "Write scope works", slug: `stage2-write-scope-${stamp}` }, negotiated);
    check("write scope can invoke write tools", writeScopeOk.ok, writeScopeOk.text.slice(0, 160));
    const wsDoc = await app.collection("queues").findOne({ slug: `stage2-write-scope-${stamp}` });
    if (wsDoc?._id) queueIds.push(wsDoc._id);

    console.log("\n=== J. unexpected errors are generic ===");
    await app.collection("businesses").updateOne({ _id: business._id }, { $set: { timezone: "Not/AZone" } });
    try {
      const boom = await callTool(tokenRW, "call_next_customer", { queueId: queueA._id.toString() }, negotiated);
      check("unexpected error becomes a generic tool error", boom.ok === false && boom.sc?.error === "Failed to call next customer", boom.text.slice(0, 200));
      check(
        "unexpected error leaks no internals",
        !/RangeError|Not\/AZone|time zone|Invalid time|at \w+ \(|\.ts:\d|node_modules|stack/i.test(boom.text),
        boom.text.slice(0, 240),
      );
      const boomRead = await callTool(tokenRO, "get_queue_status", { queueId: queueA._id.toString() }, negotiated);
      check("read tool fallback message unchanged", boomRead.ok === false && boomRead.sc?.error === "Failed to read queue data.", boomRead.text.slice(0, 200));
    } finally {
      await app.collection("businesses").updateOne({ _id: business._id }, { $set: { timezone: "Asia/Kolkata" } });
    }

    console.log("\n=== K. refactored HTTP routes still behave the same ===");
    const createC = await req(`${BASE}/api/queues`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ name: "Stage 2 HTTP", slug: `stage2-http-${stamp}` }),
    });
    const createCJson = await readJson(createC);
    check("POST /api/queues -> 201", createC.status === 201 && !!createCJson.queue, `${createC.status} ${JSON.stringify(createCJson).slice(0, 160)}`);
    const queueCId = createCJson.queue?._id ? String(createCJson.queue._id) : null;
    if (queueCId) queueIds.push(new ObjectId(queueCId));

    const missingSlug = await req(`${BASE}/api/queues`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ name: "No slug" }),
    });
    const missingSlugJson = await readJson(missingSlug);
    check("POST /api/queues still validates name+slug", missingSlug.status === 400 && missingSlugJson.message === "Name and slug are required", `${missingSlug.status} ${missingSlugJson.message}`);

    if (queueCId) {
      const patchActive = await req(`${BASE}/api/queues/${queueCId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", origin: BASE },
        body: JSON.stringify({ status: "active" }),
      });
      const patchActiveJson = await readJson(patchActive);
      check("PATCH /status still works and still returns the session", patchActive.status === 200 && patchActiveJson.session?.status === "active" && patchActiveJson.queue === undefined, `${patchActive.status} ${JSON.stringify(patchActiveJson).slice(0, 200)}`);
      const queueCDoc = await app.collection("queues").findOne({ _id: new ObjectId(queueCId) });
      check("PATCH /status now also records the queue's own status", queueCDoc?.status === "active", String(queueCDoc?.status));

      const patchBad = await req(`${BASE}/api/queues/${queueCId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", origin: BASE },
        body: JSON.stringify({ status: "bogus" }),
      });
      const patchBadJson = await readJson(patchBad);
      check("PATCH /status still rejects invalid status", patchBad.status === 400 && patchBadJson.message === "Invalid queue status", `${patchBad.status} ${patchBadJson.message}`);

      const cn1 = await req(`${BASE}/api/queues/${queueCId}/call-next`, { method: "POST", headers: { origin: BASE } });
      const cn1Json = await readJson(cn1);
      check("POST /call-next still reports nobody waiting", cn1.status === 400 && cn1Json.message === "No customers waiting", `${cn1.status} ${cn1Json.message}`);

      const cp1 = await req(`${BASE}/api/queues/${queueCId}/complete`, { method: "POST", headers: { origin: BASE } });
      const cp1Json = await readJson(cp1);
      check("POST /complete still reports nobody served", cp1.status === 400 && cp1Json.message === "No customer is currently being served", `${cp1.status} ${cp1Json.message}`);

      const sk1 = await req(`${BASE}/api/queues/${queueCId}/skip`, { method: "POST", headers: { origin: BASE } });
      const sk1Json = await readJson(sk1);
      check("POST /skip still reports nobody served", sk1.status === 400 && sk1Json.message === "No customer is currently being served", `${sk1.status} ${sk1Json.message}`);

      const sessionC = await app.collection("queuesessions").findOne(
        { queueId: new ObjectId(queueCId) },
        { sort: { createdAt: -1 } },
      );
      await app.collection("queueentries").insertOne({
        queueId: new ObjectId(queueCId),
        sessionId: sessionC._id,
        tokenNumber: 1,
        customerName: "HTTP Customer",
        status: "waiting",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cn2 = await req(`${BASE}/api/queues/${queueCId}/call-next`, { method: "POST", headers: { origin: BASE } });
      const cn2Json = await readJson(cn2);
      check("POST /call-next still serves the next customer", cn2.status === 200 && cn2Json.entry?.tokenNumber === 1 && cn2Json.entry?.status === "serving", `${cn2.status} ${JSON.stringify(cn2Json).slice(0, 200)}`);

      const cp2 = await req(`${BASE}/api/queues/${queueCId}/complete`, { method: "POST", headers: { origin: BASE } });
      const cp2Json = await readJson(cp2);
      check("POST /complete still completes the served customer", cp2.status === 200 && cp2Json.entry?.status === "completed", `${cp2.status} ${JSON.stringify(cp2Json).slice(0, 200)}`);

      const cn3 = await req(`${BASE}/api/queues/${queueCId}/call-next`, { method: "POST", headers: { origin: BASE } });
      const cn3Json = await readJson(cn3);
      check("POST /call-next still reports nobody waiting afterwards", cn3.status === 400 && cn3Json.message === "No customers waiting", `${cn3.status} ${cn3Json.message}`);
    }

    const foreignPatch = await req(`${BASE}/api/queues/${otherQueue._id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ status: "paused" }),
    });
    const foreignPatchJson = await readJson(foreignPatch);
    check("PATCH /status still 404s for another business's queue", foreignPatch.status === 404 && foreignPatchJson.message === "Queue not found", `${foreignPatch.status} ${foreignPatchJson.message}`);

    const foreignCall = await req(`${BASE}/api/queues/${otherQueue._id}/call-next`, { method: "POST", headers: { origin: BASE } });
    const foreignCallJson = await readJson(foreignCall);
    check("POST /call-next still 404s for another business's queue", foreignCall.status === 404 && foreignCallJson.message === "Queue not found", `${foreignCall.status} ${foreignCallJson.message}`);

    const noAuth = await req(`${BASE}/api/queues/${otherQueue._id}/call-next`, { method: "POST", jar: false });
    check("unauthenticated POST /call-next still 401s", noAuth.status === 401, `status ${noAuth.status}`);

    const getQueues = await req(`${BASE}/api/queues`);
    const getQueuesJson = await readJson(getQueues);
    check("GET /api/queues still works", getQueues.status === 200 && Array.isArray(getQueuesJson.queues), `${getQueues.status} ${getQueuesJson.queues?.length} queues`);
    check("GET /api/queues still hides other businesses' queues", !(getQueuesJson.queues ?? []).some((q) => String(q._id) === otherQueue._id.toString()), "");
  } finally {
    console.log("\n=== cleanup ===");
    try {
      if (queueIds.length) {
        const ids = queueIds.filter(Boolean);
        await app.collection("queueentries").deleteMany({ queueId: { $in: ids } });
        await app.collection("queuesessions").deleteMany({ queueId: { $in: ids } });
        await app.collection("queues").deleteMany({ _id: { $in: ids } });
      }
      if (otherQueue?._id) await app.collection("queues").deleteOne({ _id: otherQueue._id });
      if (otherBusiness?._id) await app.collection("businesses").deleteOne({ _id: otherBusiness._id });
      if (businessCreated && business?._id) {
        // The business itself was created by this run, so anything left under
        // it is a stray from a previous attempt.
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

  console.log(`\n=== SUMMARY: ${results.length - failures}/${results.length} passed, ${failures} failed ===`);
  if (failures) {
    for (const r of results.filter((x) => !x.ok)) console.log(`  FAILED: ${r.name} ${r.detail}`);
  }
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
