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
    <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Payitos</h1>
          <p className="text-amber-700 mt-1 text-sm">Sistema de Gestión · Panadería</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8">
          <form action={login} className="space-y-5">
            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {errorMessage}
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="usuario@payitos.local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}