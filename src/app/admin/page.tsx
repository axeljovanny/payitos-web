export default function AdminPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Panel de administración</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>Vista general de Panadería Payitos.</p>
      </div>
      <div
        className="rounded-xl p-10 text-center text-sm"
        style={{
          border: '1px dashed var(--border)',
          background: 'var(--surface)',
          color: 'var(--ink-faint)',
        }}
      >
        Dashboard en construcción
      </div>
    </div>
  )
}
