import { get } from '../lib/api';

type HealthResponse = {
  status: string;
  [key: string]: any;
};

export async function getHealth(): Promise<HealthResponse> {
  return get<HealthResponse>('/health');
}

