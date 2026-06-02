import Link from 'next/link'
import { createFixedCost } from '@/lib/gastos/actions'
import GastoFijoForm from '@/components/gastos/gasto-fijo-form'

export default function NuevoGastoFijoPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/gastos" className="text-xs text-amber-700 hover:text-amber-900 font-medium">
          ← Gastos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-2">Nuevo gasto fijo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Renta, luz, internet, gas…</p>
      </div>
      <GastoFijoForm action={createFixedCost} />
    </div>
  )
}
