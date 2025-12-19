import type { ConfigContext, ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig = appJson?.expo ?? {};

  return {
    ...config,
    ...expoConfig,
    extra: {
      ...(config.extra ?? {}),
      ...(expoConfig.extra ?? {}),
      API_URL: process.env.API_URL ?? null,
      API_KEY: process.env.API_KEY ?? 'superdev123',
      FALLBACK_LOCAL_HOST: '127.0.0.1',
      FALLBACK_LOCAL_PORT: '8000',
      TENANT_ID: process.env.TENANT_ID ?? 'my-tenant',
    },
    android: {
      ...(expoConfig.android ?? {}),
      ...(config.android ?? {}),
      useCleartextTraffic: true,
    },
  };
};

