// Full CIMD (Client ID Metadata Document) E2E over an HTTPS public tunnel:
// the server only accepts HTTPS, publicly-routable client_id URLs (per the MCP
// authorization spec), so we reach the local dev server through a cloudflared
// quick tunnel and use the tunnel origin as client_id.
//
// Usage: TUNNEL_URL=https://xxx.trycloudflare.com node --env-file=.env.local e2e-cimd-tunnel.mjs
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RESOURCE = `${BASE}/api/mcp`;
const REDIRECT_URI = "http://localhost:6274/oauth/callback";
const TUNNEL = (process.env.TUNNEL_URL ?? "").replace(/\/$/, "");
const CLIENT_ID = TUNNEL ? `${TUNNEL}/.well-known/mcp-client-metadata.json` : null;
const TEST_EMAIL = process.env.TEST_EMAIL ?? "mcp-oauth-test@qzen.local";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "McpOAuthTest123!";

if (!TUNNEL) {
  console.error("TUNNEL_URL is required");
  process.exit(2);
}

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok });
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

class CookieJar {
  constructor() { this.cookies = new Map(); }
  store(response) {
    const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    for (const line of setCookies) {
      const [pair] = line.split(";");
      const idx = pair.indexOf("=");
      if (idx < 0) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (/Expires=Thu, 01 Jan 1970/i.test(line) || value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; "); }
  clear() { this.cookies.clear(); }
}
const jar = new CookieJar();

async function req(url, { method = "GET", headers = {}, body, jar: useJar = true } = {}) {
  const h = { ...headers };
  if (useJar && jar.header()) h.cookie = jar.header();
  const response = await fetch(url, { method, headers: h, body, redirect: "manual" });
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

function resolve(loc) { return loc.startsWith("http") ? loc : `${BASE}${loc}`; }

async function main() {
  console.log(`Base: ${BASE}  Tunnel: ${TUNNEL}`);
  console.log(`CIMD client_id: ${CLIENT_ID}\n`);

  console.log("=== 1. fetch metadata document through HTTPS tunnel ===");
  const docRes = await fetch(CLIENT_ID, { headers: { accept: "application/json" } });
  const doc = await readJson(docRes);
  check("doc via tunnel -> 200", docRes.status === 200, `status ${docRes.status}`);
  check("doc client_id matches fetch URL", doc.client_id === CLIENT_ID, String(doc.client_id));
  check("doc is HTTPS + public host", /^https:\/\//.test(doc.client_id) && !/localhost|127\.0\.0\.1/.test(new URL(doc.client_id).hostname), doc.client_id);

  console.log("\n=== 2. sign in (plain, no oauth query) ===");
  jar.clear();
  let login = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    login = await req(`${BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    if (login.status === 200) break;
    const body = await readJson(login);
    console.log(`  sign-in attempt ${attempt}: ${login.status} ${JSON.stringify(body).slice(0, 160)} (retrying in 8s)`);
    await new Promise((r) => setTimeout(r, 8000));
  }
  check("sign-in -> 200 + session", login.status === 200 && jar.cookies.size > 0, `status ${login.status}`);

  console.log("\n=== 3. authorize with CIMD client_id ===");
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const challenge = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))).toString("base64url");
  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
  const url = new URL(`${BASE}/api/auth/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "mcp:read mcp:write");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", RESOURCE);
  const authRes = await req(url.toString());
  const authLoc = await redirectLocation(authRes);
  check(
    "authorize accepts CIMD client_id -> consent or direct code",
    !!authLoc && (/\/consent\?/.test(authLoc) || /[?&]code=/.test(authLoc)),
    (authLoc ?? `status ${authRes.status}`).slice(0, 200),
  );

  let codeUrl;
  if (authLoc && /\/consent\?/.test(authLoc)) {
    console.log("\n=== 4. consent ===");
    const consentUrl = new URL(resolve(authLoc));
    const oauthQuery = buildSignedOAuthQuery(consentUrl.search);
    check("consent URL carries signed query", !!oauthQuery, consentUrl.search.slice(0, 120));
    const consentRes = await req(`${BASE}/api/auth/oauth2/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", origin: BASE },
      body: JSON.stringify({ accept: true, oauth_query: oauthQuery }),
    });
    const consentJson = await readJson(consentRes);
    check("consent allow -> callback redirect", consentJson?.redirect === true && !!consentJson?.url, JSON.stringify(consentJson).slice(0, 240));
    codeUrl = new URL(resolve(consentJson?.url ?? `${BASE}/`));
  } else if (authLoc && /[?&]code=/.test(authLoc)) {
    console.log("\n=== 4. consent skipped (existing grant) ===");
    check("existing grant skips consent", true, authLoc.slice(0, 160));
    codeUrl = new URL(resolve(authLoc));
  } else {
    check("authorize reached consent or issued code", false, (authLoc ?? `status ${authRes.status}`).slice(0, 200));
    console.log(`\n=== SUMMARY: ${results.length - failures}/${results.length} passed ===`);
    process.exit(1);
  }
  check("callback state matches", codeUrl.searchParams.get("state") === state, "");
  const code = codeUrl.searchParams.get("code");
  check("callback has authorization code", !!code, codeUrl.search.slice(0, 120));

  console.log("\n=== 5. token exchange (server re-fetches the CIMD document) ===");
  const tokenRes = await req(`${BASE}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
      resource: RESOURCE,
    }).toString(),
    jar: false,
  });
  const token = await readJson(tokenRes);
  check("token exchange -> access_token", !!token.access_token, `${tokenRes.status} ${JSON.stringify(token).slice(0, 200)}`);

  if (token.access_token) {
    console.log("\n=== 6. MCP tools/list with CIMD-issued token ===");
    const mcpRes = await req(RESOURCE, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${token.access_token}`,
        "mcp-protocol-version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      jar: false,
    });
    const text = await mcpRes.text();
    let payload = null;
    if ((mcpRes.headers.get("content-type") ?? "").includes("text/event-stream")) {
      const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
      if (dataLine) { try { payload = JSON.parse(dataLine.slice(5).trim()); } catch {} }
    } else { try { payload = JSON.parse(text); } catch {} }
    const toolNames = (payload?.result?.tools ?? []).map((t) => t.name);
    check("tools/list -> ping_qzen", mcpRes.status === 200 && toolNames.includes("ping_qzen"), JSON.stringify(toolNames));
  }

  console.log(`\n=== CIMD TUNNEL E2E: ${results.length - failures}/${results.length} passed, ${failures} failed ===`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
