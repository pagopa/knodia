import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";

import { APP_BASE_PATH } from "./src/config/basepath.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: APP_BASE_PATH,
    plugins: [
      devSessionToken(env),
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
 * TODO: remove once we have a real local dev auth flow.
 * Dev-only: reads VITE_DEV_SESSION_TOKEN from .env.local and sets it in local storage.
 * Note: the key "knodia_auth_token" must match AUTH_TOKEN_KEY in src/libs/auth.ts.
 */
function devSessionToken(env: Record<string, string>): Plugin {
  return {
    apply: "serve",
    name: "dev-session-token",
    transformIndexHtml() {
      const token = env["VITE_DEV_SESSION_TOKEN"];
      if (!token) return [];
      return [
        {
          children: `localStorage.setItem("knodia_auth_token", ${JSON.stringify(token)});`,
          injectTo: "body",
          tag: "script",
        },
      ];
    },
  };
}

function getDevProxy(
  env: Record<string, string>,
): Record<string, ProxyOptions> | undefined {
  const bffUrl = env["BFF_URL"] ?? "/bff";
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
