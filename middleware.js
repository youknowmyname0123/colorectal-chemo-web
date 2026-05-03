import { NextResponse } from 'next/server'

export function middleware(request) {
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const [, encoded] = basicAuth.split(' ')
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const [, password] = decoded.split(':')

    if (password === process.env.SITE_PASSWORD) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Colorectal Chemo Tool"',
    },
  })
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
