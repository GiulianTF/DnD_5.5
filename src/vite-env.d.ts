/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_CODIGO_CONVITE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Injetada no build pelo vite.config.ts (lê a "version" do package.json)
declare const __APP_VERSION__: string
