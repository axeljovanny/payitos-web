'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string | null }

const REVALIDATE_PATHS = ['/admin/gastos', '/admin/costos', '/planificacion/costos']

function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p))
}

// ── Variable expenses (date-based log) ──────────────────────────────────────

export async function createVariableExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const expense_date = (formData.get('expense_date') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || 'operativo'
  const description = (formData.get('description') as string)?.trim()
  const amount = Number(formData.get('amount'))
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!description) return { error: 'La descripción es requerida.' }
  if (!expense_date) return { error: 'La fecha es requerida.' }
  if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('variable_expenses')
    .insert({ expense_date, category, description, amount, notes })

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function updateVariableExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const expense_date = (formData.get('expense_date') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || 'operativo'
  const description = (formData.get('description') as string)?.trim()
  const amount = Number(formData.get('amount'))
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !description) return { error: 'Descripción requerida.' }
  if (!expense_date) return { error: 'La fecha es requerida.' }
  if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('variable_expenses')
    .update({ expense_date, category, description, amount, notes })
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

// ── Fixed costs ──────────────────────────────────────────────────────────────

export async function createFixedCost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || null
  const amount = Number(formData.get('amount'))
  const effective_from = (formData.get('effective_from') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name) return { error: 'El nombre es requerido.' }
  if (isNaN(amount) || amount <= 0)
    return { error: 'El monto mensual debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('fixed_costs')
    .insert({ name, category, amount, active: true, notes, effective_from })

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
  const amount = Number(formData.get('amount'))
  const effective_from = (formData.get('effective_from') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !name) return { error: 'Nombre requerido.' }
  if (isNaN(amount) || amount <= 0)
    return { error: 'El monto mensual debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('fixed_costs')
    .update({ name, category, amount, notes, effective_from })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateAll()
  redirect('/admin/gastos')
}

export async function deleteFixedCost(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('fixed_costs').delete().eq('id', id)
  revalidateAll()
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
  const full_name = (formData.get('name') as string)?.trim()
  const role_type = (formData.get('role_type') as string)?.trim() || null
  const current_weekly_wage = Number(formData.get('current_weekly_wage') ?? 0)
  const production_hours = Number(formData.get('production_hours_per_week') ?? 0)
  const sales_hours = Number(formData.get('sales_hours_per_week') ?? 0)
  const target_weekly_salary_raw = (formData.get('target_weekly_salary') as string)?.trim()
  const target_weekly_salary = target_weekly_salary_raw ? Number(target_weekly_salary_raw) : null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!full_name) return { error: 'El nombre es requerido.' }
  if (isNaN(current_weekly_wage) || current_weekly_wage < 0)
    return { error: 'El sueldo semanal no puede ser negativo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .insert({
      full_name,
      role_type,
      active: true,
      notes,
      production_hours_per_week: production_hours,
      sales_hours_per_week: sales_hours,
      current_weekly_wage,
      target_weekly_salary,
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/gastos')
  redirect('/admin/gastos')
}

export async function updateTeamMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const full_name = (formData.get('name') as string)?.trim()
  const role_type = (formData.get('role_type') as string)?.trim() || null
  const current_weekly_wage = Number(formData.get('current_weekly_wage') ?? 0)
  const production_hours = Number(formData.get('production_hours_per_week') ?? 0)
  const sales_hours = Number(formData.get('sales_hours_per_week') ?? 0)
  const target_weekly_salary_raw = (formData.get('target_weekly_salary') as string)?.trim()
  const target_weekly_salary = target_weekly_salary_raw ? Number(target_weekly_salary_raw) : null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !full_name) return { error: 'Nombre requerido.' }
  if (isNaN(current_weekly_wage) || current_weekly_wage < 0)
    return { error: 'El sueldo semanal no puede ser negativo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .update({
      full_name,
      role_type,
      notes,
      production_hours_per_week: production_hours,
      sales_hours_per_week: sales_hours,
      current_weekly_wage,
      target_weekly_salary,
    })
    .eq('id', id)

  if (error) return { error: error.message }

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

export async function deleteTeamMember(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('team_members').delete().eq('id', id)
  revalidatePath('/admin/gastos')
}
