import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const BACKEND_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net';
const ROUNDCUBE_URL = process.env.NEXT_PUBLIC_ROUNDCUBE_URL ?? '';
const SSO_SECRET = process.env.ROUNDCUBE_SSO_SECRET ?? '';

export async function GET(req: NextRequest) {
  if (!ROUNDCUBE_URL || !SSO_SECRET) {
    return NextResponse.json({ error: 'SSO not configured' }, { status: 503 });
  }

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let mail: string;
  let pass: string;

  try {
    const res = await fetch(`${BACKEND_URL}/client_api/mail/credentials`, {
      headers: { Cookie: `auth_token=${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 502 });
    }
    const data = await res.json();
    if (data.status !== 'success') {
      return NextResponse.json({ error: 'No mail credentials' }, { status: 403 });
    }
    mail = data.mail;
    pass = data.password;
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', SSO_SECRET)
    .update(`${mail}:${ts}`)
    .digest('hex');

  const url = new URL('/api/rc/autologin.php', req.nextUrl.origin);
  url.searchParams.set('mail', mail);
  url.searchParams.set('pass', pass);
  url.searchParams.set('ts', String(ts));
  url.searchParams.set('sig', sig);

  return NextResponse.redirect(url.toString(), 302);
}
