import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net';
const ROUNDCUBE_URL = process.env.NEXT_PUBLIC_ROUNDCUBE_URL ?? '';

export async function GET(req: NextRequest) {
  if (!ROUNDCUBE_URL) {
    return NextResponse.json({ error: 'Roundcube not configured' }, { status: 503 });
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
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 502 });
    const data = await res.json();
    if (data.status !== 'success') return NextResponse.json({ error: 'No mail credentials' }, { status: 403 });
    mail = data.mail;
    pass = data.password;
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  // Step 1: GET login page to obtain CSRF token and initial session cookie
  let csrfToken: string;
  let phpSessionId: string;
  try {
    const loginPageRes = await fetch(`${ROUNDCUBE_URL}/?_task=login`);
    const html = await loginPageRes.text();

    const tokenMatch = html.match(/name="_token"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="_token"/);
    csrfToken = tokenMatch?.[1] ?? tokenMatch?.[2] ?? '';

    const setCookie = loginPageRes.headers.get('set-cookie') ?? '';
    phpSessionId = setCookie.match(/PHPSESSID=([^;,\s]+)/)?.[1] ?? '';

    if (!csrfToken || !phpSessionId) {
      return NextResponse.json({ error: 'Could not init Roundcube session' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: 'Roundcube unreachable' }, { status: 502 });
  }

  // Step 2: POST login form — all requests go through the same server IP, no session mismatch
  let loginSetCookies: string[];
  try {
    const loginRes = await fetch(`${ROUNDCUBE_URL}/?_task=login&_action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `PHPSESSID=${phpSessionId}`,
      },
      body: new URLSearchParams({
        _task: 'login',
        _action: 'login',
        _timezone: 'Europe/Moscow',
        _user: mail,
        _pass: pass,
        _token: csrfToken,
      }).toString(),
      redirect: 'manual',
    });

    if (!loginRes.headers.get('location')) {
      return NextResponse.json({ error: 'Login rejected by Roundcube' }, { status: 401 });
    }

    // getSetCookie() returns all Set-Cookie values as an array (Node 18+ / undici)
    loginSetCookies = typeof (loginRes.headers as any).getSetCookie === 'function'
      ? (loginRes.headers as any).getSetCookie()
      : [loginRes.headers.get('set-cookie')].filter(Boolean) as string[];

    if (loginSetCookies.length === 0) {
      // No new cookie issued — use the pre-login session
      loginSetCookies = [`PHPSESSID=${phpSessionId}`];
    }
  } catch {
    return NextResponse.json({ error: 'Login request failed' }, { status: 502 });
  }

  const fwdHost  = req.headers.get('x-forwarded-host');
  const fwdProto = req.headers.get('x-forwarded-proto') ?? 'https';
  const publicOrigin = fwdHost ? `${fwdProto}://${fwdHost}` : req.nextUrl.origin;

  const response = NextResponse.redirect(`${publicOrigin}/api/rc/`, 302);

  // Forward session cookies to the browser, rewriting domain/path for the proxy origin
  for (const cookie of loginSetCookies) {
    const nameValue = cookie.split(/;\s*/)[0];
    response.headers.append('Set-Cookie', `${nameValue}; Path=/; HttpOnly; Secure; SameSite=None`);
  }

  return response;
}
