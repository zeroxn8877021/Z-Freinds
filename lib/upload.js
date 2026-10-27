import { supabase } from './supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Uploads a local file to Supabase Storage with real progress (0..1).
export async function uploadFile({ bucket, path, uri, contentType, onProgress }) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status < 300 ? resolve({ key: `${bucket}/${path}` }) : reject(new Error(xhr.responseText || 'Upload failed')));
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.send(blob);
  });
}

export const publicUrl = (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

export const extFor = (asset) => {
  const m = (asset.mimeType || '').split('/')[1];
  if (m) return m === 'quicktime' ? 'mov' : m.replace('jpeg', 'jpg');
  return (asset.uri.split('.').pop() || 'jpg').toLowerCase();
};
