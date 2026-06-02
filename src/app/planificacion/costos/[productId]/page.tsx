import { notFound } from 'next/navigation'
import { fetchProductCostById } from '@/lib/costing/queries'
import CostoDetail from '@/components/costing/costo-detail'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function PlanificacionCostoDetailPage({ params }: Props) {
  const { productId } = await params
  const breakdown = await fetchProductCostById(productId)
  if (!breakdown) notFound()
  return <CostoDetail breakdown={breakdown} backPath="/planificacion/costos" />
}
