import Link from 'next/link'
import { fetchIngredientes } from '@/lib/ingredientes/queries'
import InsumosPageClient from '@/components/insumos/insumos-page-client'

export default async function PanaderoInsumosPage() {
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
        <Link
          href="/panadero/insumos/nuevo"
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

      <InsumosPageClient insumos={insumos} basePath="/panadero/insumos" />
    </div>
  )
}
