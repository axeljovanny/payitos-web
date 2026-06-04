'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMondayISO } from './queries'

export type ActionState = { error: string | null }

const DEFAULT_BASE = '/panadero/planeacion'

interface ItemInput {
  product_id: string
  day_of_week: number
  quantity_planned: number
}

function parseItems(json: string | null): ItemInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed.map((row) => {
      const r = row as Record<string, unknown>
      return {
        product_id: String(r.product_id ?? ''),
        day_of_week: Number(r.day_of_week ?? 0),
        quantity_planned: Number(r.quantity_planned ?? 0),
      }
    })
  } catch {
    return null
  }
}

export async function createWeeklyPlan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawDate = formData.get('week_start') as string
  if (!rawDate) return { error: 'Selecciona una fecha de inicio de semana.' }

  const basePath = (formData.get('return_path') as string) || DEFAULT_BASE
  const weekStart = getMondayISO(rawDate)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (existing) {
    return { error: 'Ya existe una planeación para esa semana. Búscala en la lista.' }
  }

  const { data: { session } } = await supabase.auth.getSession()

  const { data: plan, error } = await supabase
    .from('weekly_plans')
    .insert({ week_start: weekStart, status: 'draft', created_by: session?.user?.id ?? null })
    .select('id')
    .single()

  if (error || !plan) {
    return { error: error?.message ?? 'Error al crear la planeación.' }
  }

  revalidatePath(basePath)
  redirect(`${basePath}/${plan.id}/editar`)
}

export async function updateWeeklyPlan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const planId = formData.get('plan_id') as string
  if (!planId) return { error: 'ID de planeación requerido.' }

  const basePath = (formData.get('return_path') as string) || DEFAULT_BASE
  const items = parseItems(formData.get('items_json') as string)
  if (items === null) return { error: 'Datos de planeación inválidos.' }

  const BLOCKED_DAYS = new Set([4, 7])
  const validItems = items.filter(
    (i) =>
      i.product_id &&
      i.day_of_week >= 1 &&
      i.day_of_week <= 7 &&
      i.quantity_planned > 0 &&
      !BLOCKED_DAYS.has(i.day_of_week)
  )

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id, status')
    .eq('id', planId)
    .maybeSingle()

  if (!plan) return { error: 'Planeación no encontrada.' }
  if ((plan as { status: string }).status !== 'draft') {
    return { error: 'Solo puedes editar planeaciones en borrador.' }
  }

  const { error: deleteError } = await supabase
    .from('weekly_plan_items')
    .delete()
    .eq('plan_id', planId)

  if (deleteError) return { error: deleteError.message }

  if (validItems.length > 0) {
    const { error: insertError } = await supabase.from('weekly_plan_items').insert(
      validItems.map((i) => ({
        plan_id: planId,
        product_id: i.product_id,
        day_of_week: i.day_of_week,
        quantity_planned: i.quantity_planned,
      }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath(basePath)
  revalidatePath(`${basePath}/${planId}`)
  redirect(`${basePath}/${planId}`)
}

export async function deleteWeeklyPlan(formData: FormData): Promise<void> {
  const planId = formData.get('plan_id') as string
  if (!planId) return

  const basePath = (formData.get('return_path') as string) || DEFAULT_BASE
  const supabase = await createClient()

  const { error } = await supabase.from('weekly_plans').delete().eq('id', planId)
  if (error) throw new Error(`Error al eliminar planeación: ${error.message}`)

  revalidatePath(basePath)
  redirect(basePath)
}

export async function reopenWeeklyPlan(formData: FormData): Promise<void> {
  const planId = formData.get('plan_id') as string
  if (!planId) return

  const basePath = (formData.get('return_path') as string) || DEFAULT_BASE
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_plans')
    .update({ status: 'draft' })
    .eq('id', planId)
    .eq('status', 'confirmed')

  if (error) throw new Error(`Error al reabrir planeación: ${error.message}`)

  revalidatePath(DEFAULT_BASE)
  revalidatePath('/panadero/planeacion')
  redirect(basePath)
}

export async function approveWeeklyPlan(formData: FormData): Promise<void> {
  const planId = formData.get('plan_id') as string
  if (!planId) return

  const basePath = (formData.get('return_path') as string) || DEFAULT_BASE
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_plans')
    .update({ status: 'confirmed' })
    .eq('id', planId)
    .eq('status', 'draft')

  if (error) {
    throw new Error(`Error al aprobar planeación: ${error.message}`)
  }

  revalidatePath(basePath)
  revalidatePath(`${basePath}/${planId}`)
}
