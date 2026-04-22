import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

import { APP_BASE_PATH } from "./src/config/basepath.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const requestedTheme = env["VITE_THEME"];
  const theme = requestedTheme === "lynx" ? "lynx" : "orion";
  if (requestedTheme && requestedTheme !== theme) {
    console.warn(
      `[vite] Unknown VITE_THEME="${requestedTheme}", falling back to "${theme}"`,
    );
  }

  return {
    base: APP_BASE_PATH,
    plugins: [
      devtools(),
      tanstackRouter({
        autoCodeSplitting: true,
        routeFileIgnorePattern: "\\.test\\.(ts|tsx)$",
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
        "@theme.css": path.resolve(
          __dirname,
          `../../../packages/ui-kit/src/themes/${theme}.css`,
        ),
      },
    },
    server: {
      port: env["APP_PORT"] ? Number(env["APP_PORT"]) : 5673,
      proxy: getDevProxy(env),
    },
  };
});

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
