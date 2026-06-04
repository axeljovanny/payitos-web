import { createWeeklyPlan } from '@/lib/planeacion/actions'
import NuevaSemanaForm from '@/components/planeacion/nueva-semana-form'

export default async function NuevaPlaneacionPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Nueva planeación
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Crea la semana y luego captura los panes por día.
        </p>
      </div>
      <NuevaSemanaForm action={createWeeklyPlan} />
    </div>
  )
}
