import { notFound } from 'next/navigation'
import { fetchProductoById } from '@/lib/productos/queries'
import { updateProducto } from '@/lib/productos/actions'
import ProductoForm from '@/components/productos/producto-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params
  const product = await fetchProductoById(id)
  if (!product) notFound()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Editar producto</h1>
        <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
      </div>
      <ProductoForm action={updateProducto} defaultValues={product} />
    </div>
  )
}
