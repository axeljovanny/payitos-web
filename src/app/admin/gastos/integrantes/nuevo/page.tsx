import { createTeamMember } from '@/lib/gastos/actions'
import IntegranteForm from '@/components/gastos/integrante-form'
import BackButton from '@/components/ui/back-button'

export default function NuevoIntegrantePage() {
  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo integrante</h1>
      </div>
      <IntegranteForm action={createTeamMember} />
    </div>
  )
}
