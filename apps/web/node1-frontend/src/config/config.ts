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
    VITE_BFF_URL: z.string().min(1, "VITE_BFF_URL is required"),
  })
  .transform((c) => ({
    bffUrl: c.VITE_BFF_URL,
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
