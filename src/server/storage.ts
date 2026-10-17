import { put, get } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

// Private Vercel Blob in production; a local folder when no Blob token is configured (local dev)
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

function localPath(pathname: string): string {
  const full = path.resolve(LOCAL_DIR, pathname);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error('Invalid path');
  return full;
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  if (useBlob) {
    const res = await get(pathname, { access: 'private', useCache: false }).catch((err) => {
      if (err?.name === 'BlobNotFoundError') return null;
      throw err;
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  try {
    return JSON.parse(await fs.readFile(localPath(pathname), 'utf8')) as T;
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeJson(pathname: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data);
  if (useBlob) {
    await put(pathname, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return;
  }
  const file = localPath(pathname);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, file);
}
