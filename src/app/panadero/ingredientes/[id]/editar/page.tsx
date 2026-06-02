import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarIngredientePanaderoPage({ params }: Props) {
  const { id } = await params
  redirect(`/panadero/insumos/${id}/editar`)
}
