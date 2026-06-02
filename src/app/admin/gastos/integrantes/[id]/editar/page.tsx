import { notFound } from 'next/navigation'
import { fetchTeamMemberForGastosById } from '@/lib/gastos/queries'
import { updateTeamMember } from '@/lib/gastos/actions'
import IntegranteForm from '@/components/gastos/integrante-form'
import BackButton from '@/components/ui/back-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarIntegrantePage({ params }: Props) {
  const { id } = await params
  const member = await fetchTeamMemberForGastosById(id)
  if (!member) notFound()

  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Editar integrante</h1>
        <p className="text-sm text-gray-500 mt-0.5">{member.name}</p>
      </div>
      <IntegranteForm action={updateTeamMember} defaultValues={member} />
    </div>
  )
}
