import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
  const resourceManagerUrl =
    env["BFF_VITE_DEV_PROXY_TARGET_URLURL"] ?? "/signup-manager";
  const devProxyTarget = env["VITE_DEV_PROXY_TARGET_URL"];

  const resourceManagerPath = new URL(resourceManagerUrl, "http://localhost")
    .pathname;

  return devProxyTarget && resourceManagerPath.startsWith("/")
    ? {
        [resourceManagerPath]: {
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp(`^${resourceManagerPath}`), ""),
          target: devProxyTarget,
        } satisfies ProxyOptions,
      }
    : undefined;
}
