import Link from 'next/link'
import { fetchIngredientes } from '@/lib/ingredientes/queries'
import InsumosPageClient from '@/components/insumos/insumos-page-client'

export default async function AdminInsumosPage() {
  const insumos = await fetchIngredientes()
  const activos = insumos.filter((i) => i.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Insumos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {activos.length} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/insumos/categorias"
            className="rounded-xl border text-sm font-medium px-3 py-2.5 transition-colors active:scale-[0.97]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
          >
            Categorías
          </Link>
          <Link
            href="/admin/insumos/nuevo"
            className="rounded-xl text-sm font-bold px-4 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
              color: '#ffffe9',
              boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
            }}
          >
            Nuevo
          </Link>
        </div>
      </div>

      <InsumosPageClient insumos={insumos} basePath="/admin/insumos" showImport />
    </div>
  )
}
