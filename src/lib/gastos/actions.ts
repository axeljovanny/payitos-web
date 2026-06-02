'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string | null }

const REVALIDATE_PATHS = ['/admin/gastos', '/admin/costos', '/planificacion/costos']

function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p))
}

// ── Variable expenses ────────────────────────────────────────────────────────

export async function createVariableExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string) || 'operativo'
  const amount_per_hour_raw = (formData.get('amount_per_hour') as string)?.trim()
  const amount_fixed_raw = (formData.get('amount_fixed') as string)?.trim()
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name) return { error: 'El nombre es requerido.' }

  const amount_per_hour = amount_per_hour_raw ? Number(amount_per_hour_raw) : null
  const amount_fixed = amount_fixed_raw ? Number(amount_fixed_raw) : null

  if (amount_per_hour === null && amount_fixed === null)
    return { error: 'Ingresa al menos un monto (por hora o mensual fijo).' }
  if (amount_per_hour !== null && (isNaN(amount_per_hour) || amount_per_hour < 0))
    return { error: 'El monto por hora no puede ser negativo.' }
  if (amount_fixed !== null && (isNaN(amount_fixed) || amount_fixed < 0))
    return { error: 'El monto fijo no puede ser negativo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('variable_expenses')
    .insert({ name, category, amount_per_hour, amount_fixed, active: true, notes })

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function updateVariableExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string) || 'operativo'
  const amount_per_hour_raw = (formData.get('amount_per_hour') as string)?.trim()
  const amount_fixed_raw = (formData.get('amount_fixed') as string)?.trim()
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !name) return { error: 'Nombre requerido.' }

  const amount_per_hour = amount_per_hour_raw ? Number(amount_per_hour_raw) : null
  const amount_fixed = amount_fixed_raw ? Number(amount_fixed_raw) : null

  if (amount_per_hour === null && amount_fixed === null)
    return { error: 'Ingresa al menos un monto (por hora o mensual fijo).' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('variable_expenses')
    .update({ name, category, amount_per_hour, amount_fixed, notes })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function deleteVariableExpense(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('variable_expenses').delete().eq('id', id)
  revalidateAll()
}

export async function deactivateVariableExpense(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('variable_expenses').update({ active: false }).eq('id', id)
  revalidateAll()
}

export async function reactivateVariableExpense(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('variable_expenses').update({ active: true }).eq('id', id)
  revalidateAll()
}

// ── Fixed costs ──────────────────────────────────────────────────────────────

export async function createFixedCost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || null
  const amount_monthly = Number(formData.get('amount_monthly'))
  const effective_from = (formData.get('effective_from') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name) return { error: 'El nombre es requerido.' }
  if (isNaN(amount_monthly) || amount_monthly <= 0)
    return { error: 'El monto mensual debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('fixed_costs')
    .insert({ name, category, amount_monthly, active: true, notes, effective_from })

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function updateFixedCost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || null
  const amount_monthly = Number(formData.get('amount_monthly'))
  const effective_from = (formData.get('effective_from') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !name) return { error: 'Nombre requerido.' }
  if (isNaN(amount_monthly) || amount_monthly <= 0)
    return { error: 'El monto mensual debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('fixed_costs')
    .update({ name, category, amount_monthly, notes, effective_from })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function deactivateFixedCost(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('fixed_costs').update({ active: false }).eq('id', id)
  revalidateAll()
}

export async function reactivateFixedCost(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('fixed_costs').update({ active: true }).eq('id', id)
  revalidateAll()
}

// ── Team members ─────────────────────────────────────────────────────────────

export async function createTeamMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const role_type = (formData.get('role_type') as string)?.trim() || null
  const hourly_rate = Number(formData.get('hourly_rate'))
  const production_hours = Number(formData.get('production_hours_per_week') ?? 0)
  const sales_hours = Number(formData.get('sales_hours_per_week') ?? 0)
  const target_weekly_salary_raw = (formData.get('target_weekly_salary') as string)?.trim()
  const target_weekly_salary = target_weekly_salary_raw ? Number(target_weekly_salary_raw) : null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name) return { error: 'El nombre es requerido.' }
  if (isNaN(hourly_rate) || hourly_rate < 0)
    return { error: 'La tarifa por hora no puede ser negativa.' }

  const supabase = await createClient()

  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .insert({
      name,
      role_type,
      active: true,
      notes,
      production_hours_per_week: production_hours,
      sales_hours_per_week: sales_hours,
      target_weekly_salary,
    })
    .select('id')
    .single()

  if (memberError || !member) return { error: memberError?.message ?? 'Error al crear integrante.' }

  if (hourly_rate > 0) {
    const { error: wageError } = await supabase
      .from('wages')
      .insert({
        team_member_id: member.id,
        hourly_rate,
        effective_from: new Date().toISOString().split('T')[0],
      })

    if (wageError) {
      await supabase.from('team_members').delete().eq('id', member.id)
      return { error: `Integrante creado pero falló el sueldo: ${wageError.message}` }
    }
  }

  revalidatePath('/admin/gastos')
  redirect('/admin/gastos')
}

export async function updateTeamMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const role_type = (formData.get('role_type') as string)?.trim() || null
  const hourly_rate_raw = (formData.get('hourly_rate') as string)?.trim()
  const production_hours = Number(formData.get('production_hours_per_week') ?? 0)
  const sales_hours = Number(formData.get('sales_hours_per_week') ?? 0)
  const target_weekly_salary_raw = (formData.get('target_weekly_salary') as string)?.trim()
  const target_weekly_salary = target_weekly_salary_raw ? Number(target_weekly_salary_raw) : null
  const notes = (formData.get('notes') as string)?.trim() || null
  const new_wage = formData.get('update_wage') === 'true'

  if (!id || !name) return { error: 'Nombre requerido.' }

  const supabase = await createClient()

  const { error: memberError } = await supabase
    .from('team_members')
    .update({
      name,
      role_type,
      notes,
      production_hours_per_week: production_hours,
      sales_hours_per_week: sales_hours,
      target_weekly_salary,
    })
    .eq('id', id)

  if (memberError) return { error: memberError.message }

  if (new_wage && hourly_rate_raw) {
    const hourly_rate = Number(hourly_rate_raw)
    if (isNaN(hourly_rate) || hourly_rate < 0)
      return { error: 'La tarifa por hora no puede ser negativa.' }

    const { error: wageError } = await supabase
      .from('wages')
      .insert({
        team_member_id: id,
        hourly_rate,
        effective_from: new Date().toISOString().split('T')[0],
      })

    if (wageError) return { error: `Datos actualizados pero falló el sueldo: ${wageError.message}` }
  }

  revalidatePath('/admin/gastos')
  redirect('/admin/gastos')
}

export async function deactivateTeamMember(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('team_members').update({ active: false }).eq('id', id)
  revalidatePath('/admin/gastos')
}

export async function reactivateTeamMember(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('team_members').update({ active: true }).eq('id', id)
  revalidatePath('/admin/gastos')
}
