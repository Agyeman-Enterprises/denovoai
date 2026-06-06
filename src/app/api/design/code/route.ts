import { NextResponse } from 'next/server';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';
import { Client as MinioClient } from 'minio';

function getMinioClient() {
  return new MinioClient({
    endPoint:  process.env.MINIO_ENDPOINT!,
    port:      parseInt(process.env.MINIO_PORT ?? '443'),
    useSSL:    process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

export async function GET(request: Request) {
  try {
    await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (!path || path.includes('..') || path.includes('\0')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const bucket = process.env.MINIO_BUCKET_DESIGNS ?? 'ae-design-screens';
  const minio = getMinioClient();

  try {
    const stream = await minio.getObject(bucket, path);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const code = Buffer.concat(chunks).toString('utf-8');
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
