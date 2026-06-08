import Link from 'next/link'
import { fetchProcesses } from '@/lib/procesos/queries'
import { deleteProcess, reactivateProcess } from '@/lib/procesos/actions'

const COOKING_LABELS: Record<string, string> = { horno: 'Horno', estufa: 'Estufa', frio: 'Frío', otro: 'Otro' }

export default async function ProcesosPage() {
  const procesos = await fetchProcesses()
  const activos = procesos.filter((p) => p.active)
  const inactivos = procesos.filter((p) => !p.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Procesos de producción</h1>
          <p className="text-sm text-gray-500 mt-0.5">Corridas que producen una o varias variantes.</p>
        </div>
        <Link href="/admin/procesos/nueva" className="rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium px-4 py-2 text-sm transition-colors">+ Nuevo</Link>
      </div>

      <Link href="/admin/preparaciones" className="block rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-[#ed507c] transition-colors">
        <span className="text-sm font-medium text-gray-700">Preparaciones (subrecetas) →</span>
        <p className="text-xs text-gray-400 mt-0.5">Masa, Queso, Mermeladas reutilizables.</p>
      </Link>

      {activos.length > 0 && (
        <div className="space-y-2">
          {activos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/procesos/${p.id}/editar`} className="font-medium text-gray-800 hover:text-[#d43a6a] truncate block">{p.name}</Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {COOKING_LABELS[p.cooking_type] ?? p.cooking_type} · {p.output_count} variante{p.output_count !== 1 ? 's' : ''} · {p.total_pieces} pzas
                  {p.calendar_time_hours ? ` · ${p.calendar_time_hours}h cal` : ''}
                  {p.labor_hours_per_batch ? ` · ${p.labor_hours_per_batch} h-h` : ''}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/admin/procesos/${p.id}/editar`} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42] px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors">Editar</Link>
                <form action={deleteProcess}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" title="Eliminar" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm">✕</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactivos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Inactivos</p>
          {inactivos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 opacity-60 px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-medium text-gray-700 truncate">{p.name}</span>
              <form action={reactivateProcess}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42] px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors">Reactivar</button>
              </form>
            </div>
          ))}
        </div>
      )}

      {procesos.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">Sin procesos todavía.</p>
        </div>
      )}
    </div>
  )
}
