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
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Gastos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {activosCount} registro{activosCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/gastos/fijos/nuevo"
            className="rounded-xl border text-xs font-semibold px-3 py-2.5 transition-colors active:scale-[0.97]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
          >
            + Fijo
          </Link>
          <Link
            href="/admin/gastos/variable/nuevo"
            className="rounded-xl text-sm font-bold px-4 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
              color: '#ffffe9',
              boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
            }}
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
