// PÁGINA TEMPORAL DE DEBUG — eliminar antes de producción
// Accesible en: /admin/debug (protegida por requireRole('Admin') del layout)

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function rpc(supabase: Awaited<ReturnType<typeof createClient>>, fn: string, args?: Record<string, unknown>) {
  try {
    const { data, error } = args
      ? await supabase.rpc(fn, args)
      : await supabase.rpc(fn)
    if (error) return `ERROR: ${error.message}`
    if (data === null) return 'null'
    return String(data)
  } catch (e) {
    return `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`
  }
}

export default async function DebugPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  // 1. Auth state
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // 2. Role helpers via RPC (única forma válida desde Server Component)
  const [currentRole, isAdmin, isBaker, loginRole] = await Promise.all([
    rpc(supabase, 'current_user_role'),
    rpc(supabase, 'is_admin'),
    rpc(supabase, 'is_baker'),
    user?.email ? rpc(supabase, 'get_login_role', { login_email: user.email }) : Promise.resolve('no email'),
  ])

  // get_user_role puede no existir — manejamos gracefully
  const getUserRole = user?.id
    ? await rpc(supabase, 'get_user_role', { uid: user.id })
    : 'sin uid'

  // 3. Fila en public.users (puede estar bloqueada por RLS si UUID mismatch)
  let publicUserRow = 'no disponible'
  let publicUserRlsError: string | null = null
  if (user?.id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role_id, active')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      publicUserRlsError = error.message
    } else if (!data) {
      publicUserRow = 'NULL — sin fila (UUID mismatch o RLS block)'
    } else {
      publicUserRow = JSON.stringify(data, null, 2)
    }
  }

  // 4. Test de lectura (ingredients)
  const { error: readErr } = await supabase.from('ingredients').select('id').limit(1)
  const readTest = readErr ? `FAIL: ${readErr.message}` : 'OK'

  // 5. Test de escritura (dry-run: no guardamos nada)
  const { error: writeErr } = await supabase
    .from('ingredients')
    .insert({ name: '__debug_test__', base_unit: 'g' })
    .select('id')
    .single()
  // Si falla por nombre duplicado (unique) pero no por RLS → RLS OK
  let writeTest = 'FAIL (desconocido)'
  if (!writeErr) {
    writeTest = 'OK (entrada creada — borrar manualmente)'
    // Limpiar el registro de prueba
    await supabase.from('ingredients').delete().eq('name', '__debug_test__')
  } else if (writeErr.code === '23505') {
    writeTest = 'OK (unique conflict — RLS permitió la operación)'
  } else if (writeErr.code === '42501') {
    writeTest = `FAIL RLS: ${writeErr.message}`
  } else {
    writeTest = `FAIL (${writeErr.code}): ${writeErr.message}`
  }

  // 6. Cookie payitos-role
  const roleCookie = cookieStore.get('payitos-role')?.value ?? 'AUSENTE'

  const rows: [string, string, boolean?][] = [
    ['auth.getUser() error', authError?.message ?? 'none'],
    ['auth.uid (real JWT)', user?.id ?? 'NULL — no autenticado'],
    ['auth.email', user?.email ?? '—'],
    ['cookie payitos-role', roleCookie, roleCookie === 'AUSENTE'],
    ['─── RPCs ───', ''],
    ['current_user_role()', currentRole, currentRole === 'null' || currentRole.startsWith('ERROR')],
    ['is_admin()', isAdmin, isAdmin !== 'true'],
    ['is_baker()', isBaker],
    ['get_login_role(email)', loginRole, loginRole === 'null' || loginRole.startsWith('ERROR')],
    ['get_user_role(uid)', getUserRole],
    ['─── DB ───', ''],
    ['public.users row', publicUserRow, publicUserRow.includes('NULL') || publicUserRow.includes('sin fila')],
    ['RLS read error', publicUserRlsError ?? 'none'],
    ['─── Tests ───', ''],
    ['ingredients READ', readTest, readTest.startsWith('FAIL')],
    ['ingredients WRITE', writeTest, writeTest.startsWith('FAIL')],
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Auth Debug</h1>
        <p className="text-xs text-red-500 mt-0.5">Página temporal — eliminar antes de producción</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm font-mono">
          <tbody>
            {rows.map(([key, value, isError]) => {
              const isSeparator = value === ''
              if (isSeparator) {
                return (
                  <tr key={key} className="bg-gray-100">
                    <td colSpan={2} className="px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {key}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap align-top w-1/3">
                    {key}
                  </td>
                  <td className={`px-4 py-2.5 break-all ${isError ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                    {value.includes('\n') ? (
                      <pre className="whitespace-pre-wrap text-xs">{value}</pre>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">Resultados esperados DESPUÉS del fix:</p>
        <p>• current_user_role() = <code>Admin</code></p>
        <p>• is_admin() = <code>true</code></p>
        <p>• public.users row = fila con id = auth.uid</p>
        <p>• ingredients WRITE = <code>OK</code></p>
      </div>
    </div>
  )
}
