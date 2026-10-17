import { put, get } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Private Vercel Blob in production; a local folder when no Blob token is configured (local dev)
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
// On Vercel the file system is read-only, so without a Blob store nothing can be saved
const storageMissing = !useBlob && !!process.env.VERCEL;

export const storageMode: 'blob' | 'local' | 'missing' = useBlob ? 'blob' : storageMissing ? 'missing' : 'local';

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      'Хранилище не подключено. В Vercel откройте проект → Storage → Create → Blob (доступ Private), подключите его к проекту и сделайте Redeploy.'
    );
    this.name = 'StorageNotConfiguredError';
  }
}
const LOCAL_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

function localPath(pathname: string): string {
  const full = path.resolve(LOCAL_DIR, pathname);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error('Invalid path');
  return full;
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  if (storageMissing) return null;
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
  if (storageMissing) throw new StorageNotConfiguredError();
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

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function isAllowedImageType(contentType: string) {
  return contentType in IMAGE_TYPES;
}

/** Saves an uploaded image under a random name and returns that name. */
export async function saveImage(data: Buffer, contentType: string): Promise<string> {
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${IMAGE_TYPES[contentType]}`;
  const pathname = `images/${name}`;
  if (storageMissing) throw new StorageNotConfiguredError();
  if (useBlob) {
    await put(pathname, data, { access: 'private', addRandomSuffix: false, contentType });
    return name;
  }
  const file = localPath(pathname);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return name;
}

/** Reads an image saved by saveImage; null when it does not exist. */
export async function readImage(name: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!/^[a-z0-9-]+\.(jpg|png|webp|gif)$/.test(name)) return null;
  const pathname = `images/${name}`;
  const ext = name.split('.').pop()!;
  const contentType = Object.keys(IMAGE_TYPES).find((t) => IMAGE_TYPES[t] === ext)!;
  if (storageMissing) return null;
  if (useBlob) {
    const res = await get(pathname, { access: 'private' }).catch((err) => {
      if (err?.name === 'BlobNotFoundError') return null;
      throw err;
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return { data: Buffer.from(await new Response(res.stream).arrayBuffer()), contentType };
  }
  try {
    return { data: await fs.readFile(localPath(pathname)), contentType };
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}
