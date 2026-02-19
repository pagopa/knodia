/**
 * To be able to modify environment variables without needing of rebuilding the entire application,
 * we load them from a global variable `window.env` that is populated at runtime by the `env.js` script.
 * In the index.html there is a script tag that loads the `env.js` file.
 *
 * In local environment, we take the variables from the `public/env.js` file, while in production,
 * the `env.js` file is distributed by the web server.
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
