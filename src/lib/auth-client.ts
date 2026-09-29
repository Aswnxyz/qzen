import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    // While an OAuth authorization query is present in the current URL
    // (MCP flows redirect to /login?sig=...), attaches the signed
    // `oauth_query` to mutating auth requests so the server can continue the
    // authorization flow after sign-in / consent.
    oauthProviderClient(),
  ],
});
