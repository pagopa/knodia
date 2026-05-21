import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      devtools(),
      mkcert(),
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
  const signupManagerUrl = env["SIGNUP_MANAGER_URL"] ?? "/signup-manager";
  const devProxyTarget = env["VITE_DEV_PROXY_TARGET_URL"];

  const signupManagerPath = new URL(signupManagerUrl, "http://localhost")
    .pathname;

  return devProxyTarget && signupManagerPath.startsWith("/")
    ? {
        [signupManagerPath]: {
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp(`^${signupManagerPath}`), ""),
          target: devProxyTarget,
        } satisfies ProxyOptions,
      }
    : undefined;
}
