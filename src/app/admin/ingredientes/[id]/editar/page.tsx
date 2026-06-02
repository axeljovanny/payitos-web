import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarIngredienteAdminPage({ params }: Props) {
  const { id } = await params
  redirect(`/admin/insumos/${id}/editar`)
}
