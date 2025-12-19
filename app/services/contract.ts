import { post } from '../lib/api';
import { getTenantId } from '../config/apiConfig';

export type AnalyzeContractResponse = {
  answer?: string;
  [key: string]: any;
};

export async function analyzeContract(question: string): Promise<AnalyzeContractResponse> {
  const tenantId = getTenantId();
  const payload: Record<string, any> = {
    question,
    raw_text: question,
  };

  if (tenantId) {
    payload.tenant_id = tenantId;
  }

  return post<AnalyzeContractResponse>('/v1/analyze/contract', payload);
}

