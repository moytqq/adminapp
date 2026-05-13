import { NextRequest, NextResponse } from 'next/server';

// Roundcube static asset paths that may be requested without the proxy prefix
const RC_ASSET_PREFIXES = ['/skins/', '/plugins/', '/program/'];
// Same paths but with /api/ prefix (mangled by old cached content)
const RC_API_ASSET_PREFIXES = ['/api/skins/', '/api/plugins/', '/api/program/'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Roundcube AJAX / page requests: /?_task=...
  if (pathname === '/' && req.nextUrl.searchParams.has('_task')) {
    const target = req.nextUrl.clone();
    target.pathname = '/api/rc';
    return NextResponse.rewrite(target);
  }

  // Roundcube static assets at root: /skins/…  /plugins/…  /program/…
  if (RC_ASSET_PREFIXES.some(p => pathname.startsWith(p))) {
    const target = req.nextUrl.clone();
    target.pathname = '/api/rc' + pathname;
    return NextResponse.rewrite(target);
  }

  // Mangled paths: /api/skins/… → /api/rc/skins/…
  const apiAssetPrefix = RC_API_ASSET_PREFIXES.find(p => pathname.startsWith(p));
  if (apiAssetPrefix) {
    // Strip /api/ prefix, keep the rest (/skins/…) and prepend /api/rc
    const target = req.nextUrl.clone();
    target.pathname = '/api/rc' + pathname.slice('/api'.length);
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/skins/:path*',
    '/plugins/:path*',
    '/program/:path*',
    '/api/skins/:path*',
    '/api/plugins/:path*',
    '/api/program/:path*',
  ],
};
