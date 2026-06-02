import { notFound } from 'next/navigation'
import { fetchVariableExpenseById } from '@/lib/gastos/queries'
import { updateVariableExpense } from '@/lib/gastos/actions'
import GastoVariableForm from '@/components/gastos/gasto-variable-form'
import BackButton from '@/components/ui/back-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarGastoVariablePage({ params }: Props) {
  const { id } = await params
  const gasto = await fetchVariableExpenseById(id)
  if (!gasto) notFound()

  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Editar gasto variable</h1>
        <p className="text-sm text-gray-500 mt-0.5">{gasto.description}</p>
      </div>
      <GastoVariableForm action={updateVariableExpense} defaultValues={gasto} />
    </div>
  )
}
