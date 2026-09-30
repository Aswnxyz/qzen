// Shared harness for the Qzen MCP end-to-end suites.
//
// The Stage 1 read-tool suite, the Stage 2 write-tool suite, the Stage 3
// analytics suite and the OAuth suite all walk the same road: 401 challenge ->
// PRM/AS discovery -> DCR -> authorize -> login -> consent -> token ->
// JSON-RPC. This module holds that road plus the PASS/FAIL bookkeeping, so a
// fix to the flow lands everywhere at once.
//
// Each suite builds its own harness with `createHarness()`, so the cookie jar
// and the result list never leak between runs.
//
// Requires: the server running on BASE_URL and MONGODB_URI (see .env.local).
import { MongoClient } from "mongodb";

export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
export const RESOURCE = `${BASE}/api/mcp`;
export const REDIRECT_URI = "http://localhost:6274/oauth/callback";
export const TEST_EMAIL = process.env.TEST_EMAIL ?? "mcp-oauth-test@qzen.local";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "McpOAuthTest123!";

export function createHarness() {
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
    return {
      www,
      resourceMetadata: /resource_metadata="([^"]+)"/.exec(www)?.[1],
      scheme: /^Bearer\s+/i.test(www),
    };
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
    // Mimic a top-level browser navigation (address bar / link click).
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
  // jar signed in as the test user (also used for the HTTP route regressions).
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

  async function initialize(token, clientInfo = { name: "qzen-e2e", version: "0.0.1" }) {
    const res = await callMcp(token, {
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo },
    });
    return {
      negotiated: res.payload?.result?.protocolVersion ?? "2025-11-25",
      ok: !!res.payload?.result,
    };
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

  // Creates the test account through the real sign-up endpoint (so the password
  // is hashed properly) and then marks it verified, since there is no inbox to
  // read the OTP from in this environment.
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

  // Minimal discovery: prove the challenge, the resource metadata and the
  // authorization-server metadata are all reachable without a token.
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

  // Prints the shared PASS/FAIL tally and returns the process exit code.
  function summary(label = "SUMMARY") {
    console.log(`\n=== ${label}: ${results.length - failures}/${results.length} passed, ${failures} failed ===`);
    if (failures) {
      for (const r of results.filter((x) => !x.ok)) console.log(`  FAILED: ${r.name} ${r.detail}`);
    }
    return failures ? 1 : 0;
  }

  return {
    BASE,
    RESOURCE,
    REDIRECT_URI,
    TEST_EMAIL,
    TEST_PASSWORD,
    results,
    failures: () => failures,
    check,
    jar,
    req,
    readJson,
    redirectLocation,
    parseChallenge,
    loginUrlResolve,
    startAuthorize,
    loginWithSignedQuery,
    postConsent,
    exchangeToken,
    registerClient,
    getAccessToken,
    callMcp,
    initialize,
    callTool,
    ensureTestUser,
    discover,
    summary,
  };
}
