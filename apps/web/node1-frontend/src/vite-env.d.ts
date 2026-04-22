/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_THEME?: "lynx" | "orion";
}

declare module "@login-bg" {
  const src: string;
  export default src;
}
