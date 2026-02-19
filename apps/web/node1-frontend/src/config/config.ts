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
 */

import { z } from "zod";

const FrontendNode1Config = z
  .object({
    AUTH_URL: z.string().min(1, "AUTH_URL is required"),
    BFF_URL: z.string().min(1, "BFF_URL is required"),
    SESSION_TOKEN: z.string().optional(),
    // TODO ^ remove this token once we have a real local dev auth flow in place
  })
  .transform((c) => ({
    authUrl: c.AUTH_URL,
    bffUrl: c.BFF_URL,
    sessionToken: c.SESSION_TOKEN,
  }));

const parsed = FrontendNode1Config.safeParse(window.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    z.treeifyError(parsed.error).properties,
  );
  throw new Error("Invalid environment variables");
}

type FrontendNode1Config = z.infer<typeof FrontendNode1Config>;
export const config = parsed.data;

declare global {
  interface Window {
    env: unknown;
  }
}
