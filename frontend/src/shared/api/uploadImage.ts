import { httpClient } from '@/shared/api/httpClient';

/**
 * Centralised image upload helper.
 * Uses httpClient so JWT injection + 401 interception are guaranteed.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.post<{ success: boolean; data: { url: string } }>(
    '/api/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data.url;
}
