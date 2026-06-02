import { createClient } from '@/lib/supabase/server'
import type { VariableExpense, FixedCost, TeamMember } from './types'

// ── Variable expenses ────────────────────────────────────────────────────────

export async function fetchVariableExpenses(): Promise<VariableExpense[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('variable_expenses')
    .select('id, name, category, amount_per_hour, amount_fixed, active, notes')
    .order('active', { ascending: false })
    .order('category')
    .order('name')
  return (data ?? []).map((row) => ({
    ...row,
    notes: row.notes ?? null,
  })) as VariableExpense[]
}

export async function fetchVariableExpenseById(id: string): Promise<VariableExpense | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('variable_expenses')
    .select('id, name, category, amount_per_hour, amount_fixed, active, notes')
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
    .select('id, name, category, amount_monthly, active, notes, effective_from')
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
    .select('id, name, category, amount_monthly, active, notes, effective_from')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return { ...data, notes: data.notes ?? null, effective_from: data.effective_from ?? null } as FixedCost
}

// ── Team members + current wage ──────────────────────────────────────────────

export async function fetchTeamMembersForGastos(): Promise<TeamMember[]> {
  const supabase = await createClient()

  const [membersResult, wagesResult] = await Promise.all([
    supabase
      .from('team_members')
      .select('id, name, role_type, active, notes, production_hours_per_week, sales_hours_per_week, target_weekly_salary')
      .order('active', { ascending: false })
      .order('name'),
    supabase
      .from('wages')
      .select('team_member_id, hourly_rate, effective_from')
      .order('effective_from', { ascending: false }),
  ])

  const members = membersResult.data ?? []
  const wages = wagesResult.data ?? []

  // Build map of member_id → most recent hourly_rate
  const latestWage = new Map<string, number>()
  wages.forEach((w: { team_member_id: string; hourly_rate: number }) => {
    if (!latestWage.has(w.team_member_id)) {
      latestWage.set(w.team_member_id, Number(w.hourly_rate))
    }
  })

  return members.map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    role_type: (m.role_type as string | null) ?? null,
    active: m.active as boolean,
    notes: (m.notes as string | null) ?? null,
    production_hours_per_week: Number(m.production_hours_per_week ?? 0),
    sales_hours_per_week: Number(m.sales_hours_per_week ?? 0),
    target_weekly_salary: m.target_weekly_salary != null ? Number(m.target_weekly_salary) : null,
    current_hourly_rate: latestWage.get(m.id as string) ?? null,
  }))
}

export async function fetchTeamMemberForGastosById(id: string): Promise<TeamMember | null> {
  const supabase = await createClient()

  const [memberResult, wageResult] = await Promise.all([
    supabase
      .from('team_members')
      .select('id, name, role_type, active, notes, production_hours_per_week, sales_hours_per_week, target_weekly_salary')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('wages')
      .select('hourly_rate, effective_from')
      .eq('team_member_id', id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!memberResult.data) return null

  const m = memberResult.data as Record<string, unknown>
  return {
    id: m.id as string,
    name: m.name as string,
    role_type: (m.role_type as string | null) ?? null,
    active: m.active as boolean,
    notes: (m.notes as string | null) ?? null,
    production_hours_per_week: Number(m.production_hours_per_week ?? 0),
    sales_hours_per_week: Number(m.sales_hours_per_week ?? 0),
    target_weekly_salary: m.target_weekly_salary != null ? Number(m.target_weekly_salary) : null,
    current_hourly_rate: wageResult.data ? Number((wageResult.data as { hourly_rate: number }).hourly_rate) : null,
  }
}
