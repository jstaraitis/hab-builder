/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OWNER_USER_IDS?: string;
  readonly VITE_OWNER_EMAILS?: string;
  readonly VITE_AMAZON_ASSOCIATE_TAG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
