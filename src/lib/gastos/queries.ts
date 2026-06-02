import { createClient } from '@/lib/supabase/server'
import type { VariableExpense, FixedCost, TeamMember } from './types'

// ── Variable expenses ────────────────────────────────────────────────────────

export async function fetchVariableExpenses(): Promise<VariableExpense[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('variable_expenses')
    .select('id, expense_date, category, description, amount, notes')
    .order('expense_date', { ascending: false })
    .order('category')
  return (data ?? []).map((row) => ({
    ...row,
    notes: row.notes ?? null,
  })) as VariableExpense[]
}

export async function fetchVariableExpenseById(id: string): Promise<VariableExpense | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('variable_expenses')
    .select('id, expense_date, category, description, amount, notes')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return { ...data, notes: data.notes ?? null } as VariableExpense
}

// ── Fixed costs ──────────────────────────────────────────────────────────────

export async function fetchFixedCosts(): Promise<FixedCost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fixed_costs')
    .select('id, name, category, amount, active, notes, effective_from')
    .order('active', { ascending: false })
    .order('name')
  return (data ?? []).map((row) => ({
    ...row,
    notes: row.notes ?? null,
    effective_from: row.effective_from ?? null,
  })) as FixedCost[]
}

export async function fetchFixedCostById(id: string): Promise<FixedCost | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fixed_costs')
    .select('id, name, category, amount, active, notes, effective_from')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return { ...data, notes: data.notes ?? null, effective_from: data.effective_from ?? null } as FixedCost
}

// ── Team members + current wage ──────────────────────────────────────────────

export async function fetchTeamMembersForGastos(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('team_members')
    .select('id, full_name, role_type, active, notes, production_hours_per_week, sales_hours_per_week, current_weekly_wage, target_weekly_salary')
    .order('active', { ascending: false })
    .order('full_name')

  return (data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.full_name as string,
    role_type: (m.role_type as string | null) ?? null,
    active: m.active as boolean,
    notes: (m.notes as string | null) ?? null,
    production_hours_per_week: Number(m.production_hours_per_week ?? 0),
    sales_hours_per_week: Number(m.sales_hours_per_week ?? 0),
    current_weekly_wage: Number(m.current_weekly_wage ?? 0),
    target_weekly_salary: m.target_weekly_salary != null ? Number(m.target_weekly_salary) : null,
  }))
}

export async function fetchTeamMemberForGastosById(id: string): Promise<TeamMember | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('team_members')
    .select('id, full_name, role_type, active, notes, production_hours_per_week, sales_hours_per_week, current_weekly_wage, target_weekly_salary')
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  const m = data as Record<string, unknown>
  return {
    id: m.id as string,
    name: m.full_name as string,
    role_type: (m.role_type as string | null) ?? null,
    active: m.active as boolean,
    notes: (m.notes as string | null) ?? null,
    production_hours_per_week: Number(m.production_hours_per_week ?? 0),
    sales_hours_per_week: Number(m.sales_hours_per_week ?? 0),
    current_weekly_wage: Number(m.current_weekly_wage ?? 0),
    target_weekly_salary: m.target_weekly_salary != null ? Number(m.target_weekly_salary) : null,
  }
}
