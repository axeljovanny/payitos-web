import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getRoleDashboardPath, type UserRole } from '@/lib/supabase/user'

interface Props {
  searchParams: Promise<{ error?: string }>
}

const ERRORS: Record<string, string> = {
  'missing-fields': 'Por favor ingresa correo y contraseña.',
  'invalid-credentials': 'Correo o contraseña incorrectos.',
  'no-role':
    'Usuario sin rol asignado. Verifica que tu cuenta esté configurada correctamente o contacta al administrador.',
  'unexpected': 'Ocurrió un error inesperado. Intenta de nuevo.',
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  const errorMessage = error ? (ERRORS[error] ?? ERRORS['unexpected']) : null

  async function login(formData: FormData) {
    'use server'

    const email = (formData.get('email') as string | null)?.trim() ?? ''
    const password = (formData.get('password') as string | null) ?? ''

    if (!email || !password) {
      redirect('/login?error=missing-fields')
    }

    const supabase = await createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      redirect('/login?error=invalid-credentials')
    }

    const { data: role, error: roleError } = await supabase.rpc('get_login_role', {
      login_email: email,
    })

    if (roleError || !role) {
      redirect('/login?error=no-role')
    }

    const cookieStore = await cookies()
    cookieStore.set('payitos-role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    redirect(getRoleDashboardPath(role as UserRole))
  }

  return (
    <main className="min-h-dvh flex flex-col lg:flex-row">

      {/* LEFT BRAND PANEL - desktop only */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative flex-col overflow-hidden select-none"
        style={{
          background: 'linear-gradient(158deg, #f5758a 0%, #ed507c 48%, #c8305c 100%)',
        }}
      >
        {/* Radial highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 58% at 50% -5%, rgba(255,255,255,0.24) 0%, transparent 64%)',
          }}
        />

        {/* Depth circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-14 rounded-full"
          style={{ width: 280, height: 280, background: 'rgba(255,255,255,0.07)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[36%] -left-12 rounded-full"
          style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.05)' }}
        />

        {/* Croissant sticker - playful brand accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 right-7"
          style={{ transform: 'rotate(22deg)', opacity: 0.28 }}
        >
          <Image
            src="/croissant.png"
            alt=""
            width={64}
            height={64}
            className="w-14 h-auto"
          />
        </div>

        {/* Logo + tagline */}
        <div className="relative z-10 px-10 pt-10 xl:px-12 xl:pt-12 login-brand-top">
          <Image
            src="/logo-payitos.svg"
            alt="Payito's"
            width={188}
            height={76}
            className="h-[52px] w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
            priority
          />
          <p
            className="mt-3 text-sm font-semibold tracking-[0.22em] uppercase"
            style={{ color: 'rgba(255,255,233,0.82)' }}
          >
            Sistema de Gestión
          </p>
        </div>

        {/* Payardo - full centerpiece, bottom-anchored */}
        <div className="relative z-10 flex-1 flex items-end justify-center px-8 login-mascot">
          <Image
            src="/payardo.png"
            alt=""
            width={320}
            height={320}
            className="w-64 xl:w-80 h-auto"
            style={{
              filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.28))',
            }}
            priority
          />
        </div>

        {/* Footer */}
        <div className="relative z-10 px-10 pb-8 xl:px-12 xl:pb-10 login-brand-bottom">
          <p className="text-sm" style={{ color: 'rgba(255,255,233,0.50)' }}>
            El Sabor Familiar · Desde 2002
          </p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col" style={{ background: '#ffffe9' }}>

        {/* Mobile brand header */}
        <div
          className="lg:hidden relative overflow-hidden"
          style={{
            background: 'linear-gradient(158deg, #f5758a 0%, #ed507c 55%, #c8305c 100%)',
            minHeight: '152px',
          }}
        >
          {/* Radial highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 130% 70% at 30% -20%, rgba(255,255,255,0.22) 0%, transparent 65%)',
            }}
          />

          {/* Logo */}
          <div className="relative z-10 px-6 pt-6">
            <Image
              src="/logo-payitos.svg"
              alt="Payito's"
              width={148}
              height={60}
              className="h-11 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
              priority
            />
          </div>

          {/* Payardo - always visible, peeking bottom-right */}
          <div
            className="absolute bottom-0 right-4 z-10"
            aria-hidden="true"
          >
            <Image
              src="/payardo.png"
              alt=""
              width={128}
              height={128}
              className="h-32 w-auto"
              style={{
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.22))',
              }}
              priority
            />
          </div>
        </div>

        {/* ── Form area ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-[400px] login-form-entrance">

            {/* Heading block */}
            <div className="mb-8">
              <p
                className="text-sm font-bold uppercase tracking-[0.20em] mb-3"
                style={{ color: '#ed507c' }}
              >
                Bienvenido
              </p>
              <h1
                className="font-bold"
                style={{ fontSize: '2rem', lineHeight: 1.15, color: '#1a1012' }}
              >
                Iniciar sesión
              </h1>
              <p
                className="mt-2 text-base"
                style={{ color: '#6b5860' }}
              >
                Accede al sistema de gestión Payito&apos;s.
              </p>
            </div>

            <form action={login} className="space-y-5">

              {/* Error banner */}
              {errorMessage && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium login-error"
                  style={{
                    background: 'rgba(237,80,124,0.09)',
                    border: '1.5px solid rgba(237,80,124,0.30)',
                    color: '#b02558',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold"
                  style={{ color: '#1a1012' }}
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="usuario@payitos.local"
                  className="input-login w-full rounded-xl px-4 outline-none"
                  style={{
                    background: '#ffffff',
                    border: '2px solid rgba(237,80,124,0.22)',
                    color: '#1a1012',
                    fontSize: '1rem',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold"
                  style={{ color: '#1a1012' }}
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-login w-full rounded-xl px-4 outline-none"
                  style={{
                    background: '#ffffff',
                    border: '2px solid rgba(237,80,124,0.22)',
                    color: '#1a1012',
                    fontSize: '1rem',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                  }}
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-login w-full rounded-xl font-bold"
                  style={{
                    background: 'linear-gradient(180deg, #f5758a 0%, #ed507c 100%)',
                    color: '#ffffe9',
                    fontSize: '1rem',
                    letterSpacing: '0.04em',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                  }}
                >
                  Iniciar sesión
                </button>
              </div>
            </form>

            <p
              className="mt-8 text-center text-sm"
              style={{ color: 'rgba(107,88,96,0.50)' }}
            >
              El Sabor Familiar · Desde 2002
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
