import { notFound } from 'next/navigation'
import { fetchFixedCostById } from '@/lib/gastos/queries'
import { updateFixedCost } from '@/lib/gastos/actions'
import GastoFijoForm from '@/components/gastos/gasto-fijo-form'
import BackButton from '@/components/ui/back-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarGastoFijoPage({ params }: Props) {
  const { id } = await params
  const gasto = await fetchFixedCostById(id)
  if (!gasto) notFound()

  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Editar gasto fijo</h1>
        <p className="text-sm text-gray-500 mt-0.5">{gasto.name}</p>
      </div>
      <GastoFijoForm action={updateFixedCost} defaultValues={gasto} />
    </div>
  )
}
