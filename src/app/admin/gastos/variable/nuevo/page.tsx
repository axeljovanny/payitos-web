import { createVariableExpense } from '@/lib/gastos/actions'
import GastoVariableForm from '@/components/gastos/gasto-variable-form'
import BackButton from '@/components/ui/back-button'

export default function NuevoGastoVariablePage() {
  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo gasto variable</h1>
        <p className="text-sm text-gray-500 mt-0.5">Operativo o administrativo</p>
      </div>
      <GastoVariableForm action={createVariableExpense} />
    </div>
  )
}
