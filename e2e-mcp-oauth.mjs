// End-to-end OAuth 2.0 + MCP flow test for the Qzen MCP server (local).
// Exercises the exact flow MCP clients (Inspector) perform:
//   401 challenge -> PRM discovery -> AS discovery -> DCR -> authorize ->
//   login (signed oauth_query) -> consent -> token -> MCP initialize/tools/list
// plus CORS, deny, and "already signed in" variants.
import { MongoClient } from "mongodb";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RESOURCE = `${BASE}/api/mcp`;
const REDIRECT_URI = "http://localhost:6274/oauth/callback";
const TEST_EMAIL = process.env.TEST_EMAIL ?? "mcp-oauth-test@qzen.local";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "McpOAuthTest123!";

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

// Returns the redirect target of an authorize response regardless of transport:
// - browser navigations get 3xx + Location
// - fetch/XHR requests get 200 {"redirect":true,"url":...} (Node fetch always
//   carries sec-fetch-mode: cors, so the server answers JSON)
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
  const resourceMetadata = /resource_metadata="([^"]+)"/.exec(www)?.[1];
  const scheme = /^Bearer\s+/i.test(www);
  return { www, resourceMetadata, scheme };
}

// Replicates buildSignedOAuthQuery from @better-auth/oauth-provider:
// keep `sig`, every param named in `ba_param`, and `ba_param` itself.
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

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

async function makePkce() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

async function discoveryAndRegistration() {
  console.log("\n=== 1. 401 challenge + metadata discovery ===");

  const challenge = await req(`${RESOURCE}`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }), jar: false });
  check("unauthenticated POST /api/mcp -> 401", challenge.status === 401, `status ${challenge.status}`);
  const parsed = parseChallenge(challenge);
  check("WWW-Authenticate Bearer challenge present", parsed.scheme && !!parsed.resourceMetadata, parsed.www.slice(0, 160));
  check("challenged resource_metadata URL is path-suffixed", parsed.resourceMetadata?.endsWith("/.well-known/oauth-protected-resource/api/mcp") === true, parsed.resourceMetadata ?? "");

  // CORS: challenge readable cross-origin?
  const challengeCors = await req(`${RESOURCE}`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", origin: "http://localhost:6274" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }), jar: false });
  check("401 challenge carries CORS ACAO", challengeCors.headers.get("access-control-allow-origin") !== null, String(challengeCors.headers.get("access-control-allow-origin")));

  // PRM discovery via challenged URL (with Origin like a browser would)
  const prmRes = await req(parsed.resourceMetadata, { headers: { origin: "http://localhost:6274", accept: "application/json" }, jar: false });
  check("challenged PRM URL -> 200", prmRes.status === 200, `status ${prmRes.status}`);
  check("PRM carries CORS ACAO", prmRes.headers.get("access-control-allow-origin") !== null, String(prmRes.headers.get("access-control-allow-origin")));
  const prm = await readJson(prmRes);
  check("PRM resource matches MCP endpoint", prm.resource === RESOURCE, String(prm.resource));
  check("PRM advertises authorization server", Array.isArray(prm.authorization_servers) && prm.authorization_servers.length > 0, JSON.stringify(prm.authorization_servers));
  check("PRM advertises scopes", Array.isArray(prm.scopes_supported) && prm.scopes_supported.includes("mcp:read"), JSON.stringify(prm.scopes_supported));

  // bare PRM path (regression)
  const barePrm = await req(`${BASE}/.well-known/oauth-protected-resource`, { jar: false });
  check("bare PRM path still works", barePrm.status === 200, `status ${barePrm.status}`);

  const issuer = prm.authorization_servers[0];

  // RFC 8414 path-inserted discovery (the URL MCP clients build)
  const pathInserted = `${BASE}/.well-known/oauth-authorization-server${new URL(issuer).pathname}`;
  const asRes = await req(pathInserted, { headers: { origin: "http://localhost:6274", accept: "application/json" }, jar: false });
  check("path-inserted AS metadata -> 200", asRes.status === 200, `${pathInserted} status ${asRes.status}`);
  check("AS metadata carries CORS ACAO", asRes.headers.get("access-control-allow-origin") !== null, String(asRes.headers.get("access-control-allow-origin")));
  const asMeta = await readJson(asRes);
  check("AS issuer matches authorization_servers entry", asMeta.issuer === issuer, `${asMeta.issuer} vs ${issuer}`);
  check("AS advertises registration_endpoint (DCR enabled)", typeof asMeta.registration_endpoint === "string", String(asMeta.registration_endpoint));
  check("AS advertises token endpoint", typeof asMeta.token_endpoint === "string", String(asMeta.token_endpoint));
  check("AS advertises code challenge methods incl. S256", Array.isArray(asMeta.code_challenge_methods_supported) && asMeta.code_challenge_methods_supported.includes("S256"), JSON.stringify(asMeta.code_challenge_methods_supported));
  check("AS scopes_supported has no offline_access leak", !(asMeta.scopes_supported ?? []).includes("offline_access"), JSON.stringify(asMeta.scopes_supported));

  // issuer-style fallback also still works
  const issuerStyle = await req(`${issuer}/.well-known/oauth-authorization-server`, { jar: false });
  check("issuer-style AS metadata still works", issuerStyle.status === 200, `status ${issuerStyle.status}`);

  return { asMeta, issuer, resourceMetadataUrl: parsed.resourceMetadata };
}

async function dynamicClientRegistration(asMeta) {
  console.log("\n=== 2. Dynamic client registration (DCR) ===");
  const body = JSON.stringify({
    redirect_uris: [REDIRECT_URI],
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    client_name: "MCP Inspector (e2e)",
    application_type: "native",
  });

  // preflight (browser)
  const pre = await req(asMeta.registration_endpoint, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:6274",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
    jar: false,
  });
  check("DCR preflight OPTIONS -> 2xx + CORS", pre.status >= 200 && pre.status < 300 && pre.headers.get("access-control-allow-origin") !== null, `status ${pre.status}`);

  const res = await req(asMeta.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: "http://localhost:6274" },
    body,
    jar: false,
  });
  const registration = await readJson(res);
  check("unauthenticated DCR -> 201", res.status === 201, `status ${res.status} ${JSON.stringify(registration).slice(0, 200)}`);
  check("registration response has client_id", typeof registration.client_id === "string", String(registration.client_id));
  check("registration response carries CORS ACAO", res.headers.get("access-control-allow-origin") !== null, String(res.headers.get("access-control-allow-origin")));
  check("DCR cannot set skip_consent", registration.skip_consent === undefined, String(registration.skip_consent));
  return registration.client_id;
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
  // mimic a top-level browser navigation (address bar / link click)
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
  const json = await readJson(res);
  return { res, json };
}
function loginUrlResolve(loc) {
  return loc.startsWith("http") ? loc : `${BASE}${loc}`;
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
  const json = await readJson(res);
  return { res, json };
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

async function ensureTestUser() {
  // 1) create the user through the real sign-up endpoint (proper password hashing)
  const signUp = await req(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
    body: JSON.stringify({ name: "MCP OAuth Test", email: TEST_EMAIL, password: TEST_PASSWORD }),
    jar: false,
  });
  const signUpJson = await readJson(signUp);
  console.log(`  sign-up: ${signUp.status} ${signUpJson?.error?.code ?? signUpJson?.error?.message ?? "ok"}`);

  // 2) flip emailVerified (no inbox access for the OTP in this environment)
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const users = client.db("qzen").collection("user");
    const r = await users.updateOne(
      { email: TEST_EMAIL.toLowerCase() },
      { $set: { emailVerified: true, updatedAt: new Date() } },
    );
    console.log(`  mongo emailVerified=${true}: matched ${r.matchedCount}`);
  } finally {
    await client.close();
  }
}

async function main() {
  console.log(`Target: ${BASE} (${RESOURCE})`);
  await ensureTestUser();

  const { asMeta, issuer } = await discoveryAndRegistration();
  const clientId = await dynamicClientRegistration(asMeta);
  const scope = "mcp:read mcp:write";

  console.log("\n=== 3. authorize -> login -> consent -> token (fresh session) ===");
  jar.clear();
  let { res: authRes, verifier, state } = await startAuthorize(clientId, scope);
  const loginLoc = await redirectLocation(authRes);
  check(
    "unauthenticated authorize redirects to login",
    !!loginLoc && /\/login\?/.test(loginLoc),
    `status ${authRes.status} loc ${(loginLoc ?? "").slice(0, 160)}`,
  );
  check("login redirect carries signed query (sig + ba_param)", !!loginLoc && /sig=/.test(loginLoc) && /ba_param=/.test(loginLoc), (loginLoc ?? "").slice(0, 200));

  const login = await loginWithSignedQuery(loginLoc);
  check("login with oauth_query continues flow (redirect:true)", login.json?.redirect === true && typeof login.json?.url === "string", JSON.stringify(login.json).slice(0, 240));
  check("session cookie set after login", jar.cookies.size > 0, [...jar.cookies.keys()].join(","));

  const consentLoc = login.json?.url;
  const consent1 = await postConsent(consentLoc, true);
  check("consent allow -> redirect to client callback", consent1.json?.redirect === true && typeof consent1.json?.url === "string", JSON.stringify(consent1.json).slice(0, 240));
  const cbUrl = new URL(loginUrlResolve(consent1.json?.url ?? `${BASE}/`));
  check("callback has code + state + iss", !!cbUrl.searchParams.get("code") && cbUrl.searchParams.get("state") === state && !!cbUrl.searchParams.get("iss"), cbUrl.search);
  check("callback iss matches issuer", cbUrl.searchParams.get("iss") === issuer, String(cbUrl.searchParams.get("iss")));

  const token1 = await exchangeToken(asMeta, { code: cbUrl.searchParams.get("code"), verifier, clientId });
  check("token exchange -> access_token", !!token1.json?.access_token, `${token1.res.status} ${JSON.stringify(token1.json).slice(0, 200)}`);
  if (!token1.json?.access_token) throw new Error("aborting: no access token");

  console.log("\n=== 4. MCP calls with bearer token ===");
  const init = await callMcp(token1.json.access_token, {
    method: "initialize",
    params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "e2e", version: "0.0.1" } },
  });
  check("initialize -> 200 with result", init.res.status === 200 && !!init.payload?.result, `status ${init.res.status} body ${init.text.slice(0, 200)}`);
  const negotiated = init.payload?.result?.protocolVersion;
  console.log(`  negotiated protocol version: ${negotiated ?? "n/a"}`);

  const tools = await callMcp(token1.json.access_token, { method: "tools/list", params: {} }, negotiated ?? "2025-11-25");
  const toolNames = (tools.payload?.result?.tools ?? []).map((t) => t.name);
  check("tools/list -> ping_qzen", tools.res.status === 200 && toolNames.includes("ping_qzen"), JSON.stringify(toolNames));

  const ping = await callMcp(token1.json.access_token, { method: "tools/call", params: { name: "ping_qzen", arguments: {} } }, negotiated ?? "2025-11-25");
  check("tools/call ping_qzen succeeds", ping.res.status === 200 && !!ping.payload?.result, JSON.stringify(ping.payload).slice(0, 240));

  // token without scope should be rejected? (regression: requiredScopes)
  const noToken = await req(RESOURCE, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/list" }), jar: false });
  check("still 401 without bearer", noToken.status === 401, `status ${noToken.status}`);

  console.log("\n=== 5. authorize while signed in (existing grant) ===");
  jar.clear();
  // sign in normally (no oauth query)
  const plainLogin = await req(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  check("plain sign-in ok", plainLogin.status === 200, `status ${plainLogin.status}`);
  const { res: authRes2, verifier: verifier2, state: state2 } = await startAuthorize(clientId, scope);
  const signedInLoc = await redirectLocation(authRes2);
  check(
    "signed-in authorize -> consent or direct code (existing grant)",
    !!signedInLoc && (/\/consent\?/.test(signedInLoc) || /[?&]code=/.test(signedInLoc)),
    (signedInLoc ?? "").slice(0, 200),
  );
  let cbUrl2;
  if (signedInLoc && /\/consent\?/.test(signedInLoc)) {
    const consent2 = await postConsent(signedInLoc, true);
    check("signed-in consent -> callback redirect", consent2.json?.redirect === true && !!consent2.json?.url, JSON.stringify(consent2.json).slice(0, 240));
    cbUrl2 = new URL(loginUrlResolve(consent2.json?.url ?? `${BASE}/`));
  } else {
    check("existing grant skips consent (RFC-consistent)", true, signedInLoc ?? "");
    cbUrl2 = new URL(loginUrlResolve(signedInLoc ?? `${BASE}/`));
  }
  const token2 = await exchangeToken(asMeta, { code: cbUrl2.searchParams.get("code"), verifier: verifier2, clientId });
  check("signed-in token exchange ok", !!token2.json?.access_token, JSON.stringify(token2.json).slice(0, 160));
  check("signed-in flow state matched", cbUrl2.searchParams.get("state") === state2, "");

  console.log("\n=== 6. deny flow (fresh client, no grant) ===");
  const denyReg = await req(asMeta.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      client_name: "deny-test",
      application_type: "native",
    }),
    jar: false,
  });
  const denyClientId = (await readJson(denyReg)).client_id;
  const { res: authRes3 } = await startAuthorize(denyClientId, scope);
  const consentLoc3 = await redirectLocation(authRes3);
  check("fresh-client authorize -> consent page", !!consentLoc3 && /\/consent\?/.test(consentLoc3), (consentLoc3 ?? "").slice(0, 200));
  const deny = await postConsent(consentLoc3, false);
  check("consent deny -> access_denied redirect", deny.json?.redirect === true && /error=access_denied/.test(deny.json?.url ?? ""), JSON.stringify(deny.json).slice(0, 240));

  console.log("\n=== 7. expired/invalid signature guard ===");
  const badConsent = await req(`${BASE}/api/auth/oauth2/consent`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
    body: JSON.stringify({ accept: true, oauth_query: "client_id=x&sig=tampered&ba_param=client_id" }),
  });
  check("tampered oauth_query rejected", badConsent.status >= 400, `status ${badConsent.status}`);

  console.log("\n=== 8. CIMD metadata document ===");
  const docRes = await req(`${BASE}/.well-known/mcp-client-metadata.json`, { headers: { origin: "http://localhost:6274" }, jar: false });
  const doc = await readJson(docRes);
  check("CIMD doc -> 200 + CORS", docRes.status === 200 && docRes.headers.get("access-control-allow-origin") !== null, `status ${docRes.status}`);
  check("CIMD client_id matches fetch URL", doc.client_id === `${BASE}/.well-known/mcp-client-metadata.json`, String(doc.client_id));
  check("CIMD covers Inspector web + CLI/TUI loopback callbacks",
    Array.isArray(doc.redirect_uris) &&
      ["http://localhost:6274/oauth/callback", "http://127.0.0.1:6274/oauth/callback", "http://localhost:6276/oauth/callback", "http://127.0.0.1:6276/oauth/callback"]
        .every((u) => doc.redirect_uris.includes(u)),
    JSON.stringify(doc.redirect_uris));
  check("CIMD scope covers PRM-advertised scopes", (doc.scope ?? "").includes("mcp:read") && (doc.scope ?? "").includes("mcp:write"), String(doc.scope));

  // CIMD's client_id MUST be an HTTPS, publicly-routable URL (MCP auth spec);
  // the server therefore rejects this HTTP localhost document URL. The positive
  // path (full authorize -> consent -> token -> tools/list over an HTTPS origin)
  // is covered by e2e-cimd-tunnel.mjs, and in production by the real host.
  const cimdAuth = await startAuthorize(doc.client_id, scope);
  const cimdLoc = await redirectLocation(cimdAuth.res);
  const cimdErrBody = cimdAuth.res.status >= 400 && cimdLoc === null ? await readJson(cimdAuth.res) : null;
  const gotConsentOrCode = !!cimdLoc && (/\/consent\?/.test(cimdLoc) || /[?&]code=/.test(cimdLoc));
  const rejectionVisible = !gotConsentOrCode && (/invalid_client/.test(cimdLoc ?? "") || /invalid_client/.test(JSON.stringify(cimdErrBody ?? {})));
  check(
    "HTTP localhost CIMD client_id rejected per spec (positive path: e2e-cimd-tunnel.mjs)",
    rejectionVisible,
    (cimdLoc ?? JSON.stringify(cimdErrBody ?? `status ${cimdAuth.res.status}`)).slice(0, 200),
  );

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
