import { NextRequest, NextResponse } from 'next/server';

const TARGET_BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'https://extracurricular-sc5rlfdq.b4a.run/api').replace(/\/$/, '');

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const subPath = params.path ? params.path.join('/') : '';
  const search = request.nextUrl.search || '';
  const targetUrl = `${TARGET_BACKEND}/${subPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((val, key) => {
    // Exclude host header to let the target host be resolved correctly
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });

  let body: BodyInit | null = null;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      body = null;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((val, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, val);
      }
    });

    const responseText = await backendResponse.text();
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Next.js API Proxy Error] Failed to proxy ${request.method} to ${targetUrl}:`, error.message);
    return NextResponse.json(
      {
        success: false,
        message: 'The CNHS backend service is waking up or temporarily unreachable. Please retry in a few moments.',
        error: error.message,
      },
      { status: 503 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
