import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, type UserRole } from '@/lib/session-token';

const ROLE_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/owner', roles: ['OWNER', 'ADMIN'] },
  { prefix: '/kasir', roles: ['KASIR', 'ADMIN'] },
  { prefix: '/supplier', roles: ['SUPPLIER', 'ADMIN'] },
  { prefix: '/orders', roles: ['PELANGGAN'] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('kopi_session')?.value;
  const user = token ? await verifyToken(token) : null;

  // Protected route checking
  const routeMatch = ROLE_ROUTES.find((r) => pathname.startsWith(r.prefix));

  if (routeMatch) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!routeMatch.roles.includes(user.role)) {
      // Redirect to user's appropriate home or default dashboard
      return NextResponse.redirect(new URL(getRoleDefaultPath(user.role), request.url));
    }
  }

  return NextResponse.next();
}

function getRoleDefaultPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/menu';
    case 'OWNER':
      return '/owner/dashboard';
    case 'KASIR':
      return '/kasir/orders';
    case 'SUPPLIER':
      return '/supplier/purchases';
    default:
      return '/';
  }
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/kasir/:path*', '/supplier/:path*', '/orders/:path*'],
};
