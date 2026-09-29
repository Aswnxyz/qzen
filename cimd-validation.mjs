// Validates the CIMD document our route serves when reached with
// production-style headers (Host: qzen.onrender.com, X-Forwarded-Proto: https)
// against the SAME validators better-auth uses when resolving a client_id.
import http from "node:http";
import { validateCimdMetadata, validateClientIdUrl } from "@better-auth/cimd";

function fetchDoc() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: 3000,
        path: "/.well-known/mcp-client-metadata.json",
        method: "GET",
        headers: {
          Host: "qzen.onrender.com",
          "X-Forwarded-Proto": "https",
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok });
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const { status, body } = await fetchDoc();
check("doc fetch -> 200", status === 200, `status ${status}`);
const doc = JSON.parse(body);
console.log("client_id:", doc.client_id);

check(
  "client_id derived from forwarded production origin",
  doc.client_id === "https://qzen.onrender.com/.well-known/mcp-client-metadata.json",
  String(doc.client_id),
);

const urlError = validateClientIdUrl(doc.client_id);
check("validateClientIdUrl (server-side) accepts client_id", urlError === null, String(urlError));

const validation = validateCimdMetadata(doc.client_id, doc, {
  metadataProfile: "mcp-2026-07-28",
});
check("validateCimdMetadata accepts served document", validation.valid === true, JSON.stringify(validation));

check(
  "document grants both supported scopes",
  (doc.scope ?? "").split(" ").includes("mcp:read") && (doc.scope ?? "").split(" ").includes("mcp:write"),
  String(doc.scope),
);

const httpErr = validateClientIdUrl("http://localhost:3000/.well-known/mcp-client-metadata.json");
check(
  "validateClientIdUrl rejects HTTP client_id (why local CIMD testing needs HTTPS)",
  httpErr !== null,
  String(httpErr),
);

console.log(`\n=== CIMD validation: ${results.length - failures}/${results.length} passed ===`);
process.exit(failures ? 1 : 0);
