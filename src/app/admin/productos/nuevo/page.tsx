import { createProducto } from '@/lib/productos/actions'
import ProductoForm from '@/components/productos/producto-form'

export default function NuevoProductoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nuevo producto</h1>
        <p className="text-sm text-gray-500 mt-0.5">Define precio y parámetros de producción.</p>
      </div>
      <ProductoForm action={createProducto} />
    </div>
  )
}
