export default function PlanificacionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Costeo y planeación</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>Análisis de costos y planificación operativa.</p>
      </div>
      <div
        className="rounded-xl p-10 text-center text-sm"
        style={{
          border: '1px dashed var(--border)',
          background: 'var(--surface)',
          color: 'var(--ink-faint)',
        }}
      >
        Módulo de costeo en construcción
      </div>
    </div>
  )
}
