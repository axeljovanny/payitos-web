import Link from 'next/link'
import { createVariableExpense } from '@/lib/gastos/actions'
import GastoVariableForm from '@/components/gastos/gasto-variable-form'

export default function NuevoGastoVariablePage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/gastos" className="text-xs text-amber-700 hover:text-amber-900 font-medium">
          ← Gastos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo gasto variable</h1>
        <p className="text-sm text-gray-500 mt-0.5">Operativo o administrativo</p>
      </div>
      <GastoVariableForm action={createVariableExpense} />
    </div>
  )
}
