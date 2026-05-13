/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY: string
  readonly VITE_PEXELS_API_KEY: string
  // Añade aquí cualquier otra variable VITE_ que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}