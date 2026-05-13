import { NextRequest, NextResponse } from 'next/server';

const RC_ORIGIN = process.env.NEXT_PUBLIC_ROUNDCUBE_URL ?? '';
const PROXY_PREFIX = '/api/rc';

// Rewrite absolute URLs in Location headers to go through the proxy
function rewriteLocation(value: string): string {
  if (RC_ORIGIN && value.startsWith(RC_ORIGIN)) {
    return PROXY_PREFIX + value.slice(RC_ORIGIN.length);
  }
  // Absolute-path redirect (e.g. /?_task=mail) — must pass through proxy prefix
  if (value.startsWith('/') && !value.startsWith(PROXY_PREFIX)) {
    return PROXY_PREFIX + value;
  }
  return value;
}

// Rewrite URLs embedded in HTML / JS / CSS so assets load through the proxy
function rewriteBody(text: string, isHtml: boolean): string {
  if (RC_ORIGIN) {
    const escaped = RC_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'g'), PROXY_PREFIX);
  }
  // HTML attributes: href="/…" src="/…" action="/…"
  text = text.replace(/(href|src|action)="\//g, `$1="${PROXY_PREFIX}/`);
  text = text.replace(/(href|src|action)='\//g, `$1='${PROXY_PREFIX}/`);
  // CSS url(/…)
  text = text.replace(/url\(\//g, `url(${PROXY_PREFIX}/`);
  // JS string absolute paths for Roundcube asset dirs
  for (const dir of ['skins', 'plugins', 'program']) {
    text = text.replace(new RegExp(`"/${dir}/`, 'g'), `"${PROXY_PREFIX}/${dir}/`);
    text = text.replace(new RegExp(`'/${dir}/`, 'g'), `'${PROXY_PREFIX}/${dir}/`);
  }
  // Inject <base> tag so relative URLs in JS (e.g. skin_path) resolve via the proxy
  if (isHtml) {
    text = text.replace(/(<head[^>]*>)/i, `$1<base href="${PROXY_PREFIX}/">`);
  }
  return text;
}

const TEXT_TYPES = ['text/html', 'text/javascript', 'application/javascript', 'text/css'];

async function handler(req: NextRequest) {
  if (!RC_ORIGIN) {
    return NextResponse.json({ error: 'Roundcube URL not configured' }, { status: 503 });
  }

  // Build upstream URL
  const url = new URL(req.url);
  const rcPath = url.pathname.replace(new RegExp(`^${PROXY_PREFIX}`), '') || '/';
  const targetUrl = RC_ORIGIN + rcPath + url.search;

  // Forward headers, strip hop-by-hop and host
  const proxyHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (['host', 'x-forwarded-host', 'connection', 'keep-alive'].includes(lower)) return;
    proxyHeaders.set(key, value);
  });

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body,
      redirect: 'manual',
    });
  } catch (_e) {
    return NextResponse.json({ error: 'Upstream unreachable' }, { status: 502 });
  }

  // Build response headers
  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (['transfer-encoding', 'connection', 'keep-alive', 'content-encoding', 'content-length'].includes(lower)) return;
    if (lower === 'location') {
      resHeaders.set(key, rewriteLocation(value));
    } else if (lower === 'set-cookie') {
      resHeaders.append(key, value);
    } else {
      resHeaders.set(key, value);
    }
  });

  const ct = upstream.headers.get('content-type') ?? '';
  const isText = TEXT_TYPES.some(t => ct.includes(t));

  if (isText) {
    const isHtml = ct.includes('text/html');
    const text = await upstream.text();
    return new NextResponse(rewriteBody(text, isHtml), { status: upstream.status, headers: resHeaders });
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const HEAD    = handler;
export const OPTIONS = handler;
