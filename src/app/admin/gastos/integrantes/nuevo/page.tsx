import Link from 'next/link'
import { createTeamMember } from '@/lib/gastos/actions'
import IntegranteForm from '@/components/gastos/integrante-form'

export default function NuevoIntegrantePage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/gastos" className="text-xs text-amber-700 hover:text-amber-900 font-medium">
          ← Gastos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo integrante</h1>
      </div>
      <IntegranteForm action={createTeamMember} />
    </div>
  )
}
