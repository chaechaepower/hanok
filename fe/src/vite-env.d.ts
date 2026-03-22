/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADMIN_ROUTE_ID?: string;
  readonly VITE_ADMIN_ROUTE_PASSWORD?: string;
  readonly VITE_WS_CONNECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
