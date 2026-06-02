import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchVariableExpenseById } from '@/lib/gastos/queries'
import { updateVariableExpense } from '@/lib/gastos/actions'
import GastoVariableForm from '@/components/gastos/gasto-variable-form'

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
        <Link href="/admin/gastos" className="text-xs text-amber-700 hover:text-amber-900 font-medium">
          ← Gastos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-2">Editar gasto variable</h1>
        <p className="text-sm text-gray-500 mt-0.5">{gasto.name}</p>
      </div>
      <GastoVariableForm action={updateVariableExpense} defaultValues={gasto} />
    </div>
  )
}
