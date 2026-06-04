import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROLE_PATHS: Record<string, string> = {
  Admin: '/admin',
  panadero: '/panadero',
  vendedor: '/vendedor',
  planificacion: '/planificacion',
}

function getRolePath(role: string): string | null {
  return ROLE_PATHS[role] ?? null
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads from the JWT cookie — no network round-trip to Supabase Auth
  // on every request. It still handles token refresh via the refresh token when
  // the access token is expired (write via setAll above). The layout's
  // getCurrentUser() performs the definitive validation with getUser() once per
  // render, so we don't need to duplicate that network call here.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!session) {
    if (path !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Authenticated on /login → redirect to role dashboard ─────────────────
  // Use the payitos-role cookie as fast path — set by the login action, removed
  // on logout. Avoids a DB round-trip (current_user_role RPC) on every /login visit.
  if (path === '/login') {
    const roleCookie = request.cookies.get('payitos-role')?.value
    const destination = roleCookie ? getRolePath(roleCookie) : null
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
