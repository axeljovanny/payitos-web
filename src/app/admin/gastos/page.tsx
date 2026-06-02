import Link from 'next/link'
import { fetchVariableExpenses, fetchFixedCosts, fetchTeamMembersForGastos } from '@/lib/gastos/queries'
import GastosPageClient from '@/components/gastos/gastos-page-client'

export default async function AdminGastosPage() {
  const [variableExpenses, fixedCosts, teamMembers] = await Promise.all([
    fetchVariableExpenses(),
    fetchFixedCosts(),
    fetchTeamMembersForGastos(),
  ])

  const activosCount =
    variableExpenses.length +
    fixedCosts.filter((f) => f.active).length +
    teamMembers.filter((m) => m.active).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Gastos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activosCount} registro{activosCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/gastos/fijos/nuevo"
            className="rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold px-3 py-2.5 transition-colors"
          >
            + Fijo
          </Link>
          <Link
            href="/admin/gastos/variable/nuevo"
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            + Gasto
          </Link>
        </div>
      </div>

      <GastosPageClient
        variableExpenses={variableExpenses}
        fixedCosts={fixedCosts}
        teamMembers={teamMembers}
      />
    </div>
  )
}
