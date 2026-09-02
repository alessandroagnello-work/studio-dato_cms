import { NextResponse } from 'next/server';

const defaultLocale = 'it';
const locales = ['it', 'en'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verifica se l'URL contiene gia' una lingua supportata
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Reindirizza alla lingua di default (es. /it)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};