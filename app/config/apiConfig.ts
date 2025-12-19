import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExtraConfig = {
  API_URL?: string | null;
  API_KEY?: string | null;
  FALLBACK_LOCAL_HOST?: string;
  FALLBACK_LOCAL_PORT?: string;
  TENANT_ID?: string | null;
  tenant_id?: string | null;
  tenantId?: string | null;
};

const resolveExtra = (): ExtraConfig => {
  const expoConfigExtra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
  const manifestExtra = ((Constants as any)?.manifest?.extra ?? {}) as ExtraConfig;
  const manifest2Extra = ((Constants as any)?.manifest2?.extra ??
    (Constants as any)?.manifest2?.extraOverrides ??
    {}) as ExtraConfig;

  return {
    ...manifestExtra,
    ...manifest2Extra,
    ...expoConfigExtra,
  };
};

const fallbackTenantId = 'my-tenant';

const hasExplicitApiUrl = () => {
  const extra = resolveExtra();
  return typeof extra.API_URL === 'string' && extra.API_URL.trim().length > 0;
};

const extractHost = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    const normalized = value.includes('://') ? value : `http://${value}`;
    const { hostname } = new URL(normalized);
    if (hostname) {
      return hostname;
    }
  } catch {
    // ignore parsing errors
  }

  return null;
};

const isLocalhost = (host?: string | null) => {
  if (!host) return true;
  const normalized = host.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '[::1]'
  );
};

const resolveDevServerHost = (): string | null => {
  const potentialSources = [
    Constants.expoConfig?.hostUri,
    (Constants as any)?.manifest?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoClient?.debuggerHost,
    process.env.EXPO_PACKAGER_HOSTNAME,
  ];

  for (const source of potentialSources) {
    const host = extractHost(source);
    if (host) {
      return host;
    }
  }

  return null;
};

const resolveFallbackHost = () => {
  if (hasExplicitApiUrl()) {
    return null;
  }

  const devServerHost = resolveDevServerHost();

  if (Platform.OS === 'android') {
    if (!devServerHost || isLocalhost(devServerHost)) {
      return '10.0.2.2';
    }
    return devServerHost;
  }

  if (devServerHost) {
    if (isLocalhost(devServerHost)) {
      return '127.0.0.1';
    }
    return devServerHost;
  }

  const extra = resolveExtra();
  return extra.FALLBACK_LOCAL_HOST ?? '127.0.0.1';
};

export const getBaseUrl = () => {
  if (hasExplicitApiUrl()) {
    const extra = resolveExtra();
    return extra.API_URL!.trim();
  }

  const host = resolveFallbackHost();
  const extra = resolveExtra();
  const port = extra.FALLBACK_LOCAL_PORT ?? '8000';

  return `http://${host}:${port}`;
};

export const getApiKey = () => {
  const extra = resolveExtra();
  return extra.API_KEY ?? '';
};

export const getTenantId = () => {
  const extra = resolveExtra();
  const candidate =
    extra.TENANT_ID ?? extra.tenant_id ?? extra.tenantId ?? fallbackTenantId;

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return fallbackTenantId;
};


