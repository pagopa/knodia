import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";

import { APP_BASE_PATH } from "./src/config/basepath.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: APP_BASE_PATH,
    plugins: [
      devSessionToken(),
      devtools(),
      tanstackRouter({
        autoCodeSplitting: true,
        target: "react",
      }),
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: env["APP_PORT"] ? Number(env["APP_PORT"]) : 5673,
      proxy: getDevProxy(env),
    },
  };
});

/**
 * TODO remove this once we have a real local dev auth flow in place.
 * Dev-only: reads `docker/tokens/ui-session.token` and injects it into window.env
 */
function devSessionToken(): Plugin {
  return {
    apply: "serve",
    name: "dev-session-token",
    transformIndexHtml() {
      try {
        const token = fs
          .readFileSync(
            path.resolve(__dirname, "../../../docker/tokens/ui-session.token"),
            "utf-8",
          )
          .trim();
        return [
          {
            children: `window.env.SESSION_TOKEN = ${JSON.stringify(token)};`,
            injectTo: "body",
            tag: "script",
          },
        ];
      } catch {
        return [];
      }
    },
  };
}

function getDevProxy(
  env: Record<string, string>,
): Record<string, ProxyOptions> | undefined {
  const bffUrl = env["VITE_BFF_URL"] ?? "/bff";
  const devProxyTarget = env["VITE_DEV_PROXY_TARGET_URL"];

  const bffPath = new URL(bffUrl, "http://localhost").pathname;

  return devProxyTarget && bffPath.startsWith("/")
    ? {
        [bffPath]: {
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${bffPath}`), ""),
          target: devProxyTarget,
        } satisfies ProxyOptions,
      }
    : undefined;
}
