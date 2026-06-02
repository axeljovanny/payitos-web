import { createFixedCost } from '@/lib/gastos/actions'
import GastoFijoForm from '@/components/gastos/gasto-fijo-form'
import BackButton from '@/components/ui/back-button'

export default function NuevoGastoFijoPage() {
  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/gastos" label="Gastos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo gasto fijo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Renta, luz, internet, gas…</p>
      </div>
      <GastoFijoForm action={createFixedCost} />
    </div>
  )
}
