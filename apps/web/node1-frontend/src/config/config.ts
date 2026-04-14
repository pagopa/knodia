/**
 * To allow environment variables to be changed without rebuilding the application,
 * we load them from the global `window.env` object, which is populated at runtime
 * by the `env.js` script.
 *
 * The `env.js` file is loaded in `index.html` via a dedicated `<script>` tag.
 *
 * In local development, variables are read from `public/env.js`. In production,
 * `env.js` is served by the web server.
 *
 * Note: `public/env.js` is removed from the final build in the Dockerfile, so it
 * is not included in the production image.
 *
 * Auth: Uses OIDC (OpenID Connect) with Cognito in production and local-cognito in development.
 * Requires COGNITO_AUTHORITY, COGNITO_CLIENT_ID, COGNITO_REDIRECT_URI.
 */

import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

const FrontendNode1Config = z.object({
  BFF_URL: z.string().min(1, "BFF_URL is required"),
  COGNITO_AUTHORITY: z.string().min(1, "COGNITO_AUTHORITY is required"),
  COGNITO_CLIENT_ID: z.string().min(1, "COGNITO_CLIENT_ID is required"),
  COGNITO_DOMAIN: z.string().min(1, "COGNITO_DOMAIN is required"),
  COGNITO_LOGOUT_URI: z.string().min(1, "COGNITO_LOGOUT_URI is required"),
  COGNITO_REDIRECT_URI: z.string().min(1, "COGNITO_REDIRECT_URI is required"),
  KNODE_ID: KnodeId,

  MAX_KEYS_PER_KEYCHAIN: z.coerce
    .number()
    .min(1, "MAX_KEYS_PER_KEYCHAIN must be at least 1"),
});

const parsed = FrontendNode1Config.safeParse(window.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    z.treeifyError(parsed.error).properties,
  );
  throw new Error("Invalid environment variables");
}

export const config = {
  bffUrl: parsed.data.BFF_URL,
  cognito: {
    authority: parsed.data.COGNITO_AUTHORITY,
    clientId: parsed.data.COGNITO_CLIENT_ID,
    domain: parsed.data.COGNITO_DOMAIN,
    logoutUri: parsed.data.COGNITO_LOGOUT_URI,
    redirectUri: parsed.data.COGNITO_REDIRECT_URI,
  },
  knodeId: parsed.data.KNODE_ID,
  maxKeysPerKeychain: parsed.data.MAX_KEYS_PER_KEYCHAIN,
};

declare global {
  interface Window {
    env: unknown;
  }
}
