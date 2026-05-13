import { NextRequest, NextResponse } from 'next/server';

// Roundcube static asset paths that may be requested at the site root
const RC_ASSET_PREFIXES = ['/skins/', '/plugins/', '/program/'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Roundcube AJAX / page requests: /?_task=...
  if (pathname === '/' && req.nextUrl.searchParams.has('_task')) {
    const target = req.nextUrl.clone();
    target.pathname = '/api/rc';
    return NextResponse.rewrite(target);
  }

  // Roundcube static assets: /skins/…  /plugins/…  /program/…
  if (RC_ASSET_PREFIXES.some(p => pathname.startsWith(p))) {
    const target = req.nextUrl.clone();
    target.pathname = '/api/rc' + pathname;
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/skins/:path*', '/plugins/:path*', '/program/:path*'],
};
