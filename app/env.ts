import { getBaseUrl, getApiKey, getTenantId } from './config/apiConfig';

const booleanFromEnv = (value?: string | boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return true;
};

export const ENV = {
  API_URL: getBaseUrl(),
  API_KEY: getApiKey(),
  TENANT_ID: getTenantId(),
  NOTIFICATIONS_ENABLED: booleanFromEnv(
    process.env.EXPO_PUBLIC_NOTIFICATIONS_ENABLED ??
      process.env.NOTIFICATIONS_ENABLED
  ),
} as const;

// Backwards compatibility for modules importing the old env object
export const env = {
  API_URL: ENV.API_URL,
  API_KEY: ENV.API_KEY,
  NOTIFICATIONS_ENABLED: ENV.NOTIFICATIONS_ENABLED,
} as const;


