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
  // Mutable — recreated inside setAll so refreshed auth cookies propagate
  // to the forwarded request headers downstream.
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
          // Write to request so downstream code sees the refreshed session
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          // Recreate response with updated request, then set cookies on it
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verify session — getUser() is the only safe call here (getSession() trusts
  // the cookie without re-validating with the server). Also refreshes tokens
  // if expired, writing back via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!user) {
    if (path !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Authenticated on /login → redirect to role dashboard ─────────────────
  // Use the cookie fast path to avoid a DB round-trip on every page load.
  // Fallback to RPC only when the cookie is absent (e.g. first load after
  // cookie expiry). Role-route enforcement is left entirely to the layouts
  // so that the cookie (proxy) and the RPC (layout) never disagree and
  // create a redirect loop.
  if (path === '/login') {
    const roleCookie = request.cookies.get('payitos-role')?.value
    let role: string | null = roleCookie ?? null

    if (!role) {
      const { data } = await supabase.rpc('current_user_role')
      role = data ?? null
    }

    const destination = role ? getRolePath(role) : null
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon\\.ico).*)',
  ],
}
