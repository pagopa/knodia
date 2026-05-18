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

import { z } from "zod";

const KnodiaSignupFrontendConfig = z.object({
  SIGNUP_MANAGER_URL: z.string().min(1, "SIGNUP_MANAGER_URL is required"),
});

const parsed = KnodiaSignupFrontendConfig.safeParse(window.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    z.treeifyError(parsed.error).properties,
  );
  throw new Error("Invalid environment variables");
}

export const config = {
  signupManagerUrl: parsed.data.SIGNUP_MANAGER_URL,
};

declare global {
  interface Window {
    env: unknown;
  }
}
