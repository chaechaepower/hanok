/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_CONNECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
