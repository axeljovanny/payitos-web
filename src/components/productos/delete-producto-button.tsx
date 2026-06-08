'use client'

import { deleteProducto } from '@/lib/productos/actions'

interface Props {
  productId: string
  productName: string
}

export default function DeleteProductoButton({ productId, productName }: Props) {
  return (
    <form
      action={deleteProducto}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar "${productName}"? Se borrará también su receta. Esta acción no se puede deshacer.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        className="text-xs text-red-400 hover:text-red-600 transition-colors"
      >
        Eliminar producto
      </button>
    </form>
  )
}
