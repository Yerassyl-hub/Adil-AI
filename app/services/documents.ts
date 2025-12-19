import { api } from '../lib/api';

type NativeFile = {
  uri: string;
  name: string;
  type: string;
};

export type Uploadable = File | Blob | NativeFile;

export interface UploadDocumentResponse {
  id?: string;
  filename?: string;
  url?: string;
  [key: string]: any;
}

const toFormData = (file: Uploadable): FormData => {
  const formData = new FormData();

  if (
    typeof file === 'object' &&
    'uri' in file &&
    typeof (file as NativeFile).uri === 'string'
  ) {
    const nativeFile = file as NativeFile;
    formData.append('file', {
      uri: nativeFile.uri,
      name: nativeFile.name ?? 'document',
      type: nativeFile.type ?? 'application/octet-stream',
    } as any);
  } else {
    formData.append('file', file as any);
  }

  return formData;
};

export async function uploadDocument(file: Uploadable): Promise<UploadDocumentResponse> {
  const formData = toFormData(file);

  return api<UploadDocumentResponse>('/v1/documents/upload', {
    method: 'POST',
    body: formData,
  });
}


