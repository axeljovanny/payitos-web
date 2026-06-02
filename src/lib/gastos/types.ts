// ── Variable expenses (date-based expense log) ──

export interface VariableExpense {
  id: string
  expense_date: string   // ISO date YYYY-MM-DD
  category: string
  description: string
  amount: number
  notes: string | null
}

// ── Fixed costs (recurring monthly overhead) ──

export interface FixedCost {
  id: string
  name: string
  category: string | null
  amount: number
  active: boolean
  notes: string | null
  effective_from: string | null
}

// ── Team members + current wage ──

export interface TeamMember {
  id: string
  name: string                      // maps from full_name in DB
  role_type: string | null
  active: boolean
  notes: string | null
  production_hours_per_week: number
  sales_hours_per_week: number
  current_weekly_wage: number       // direct column, no wages table
  target_weekly_salary: number | null
}

export const ROLE_TYPE_OPTIONS = [
  { value: 'production', label: 'Producción' },
  { value: 'sales',      label: 'Ventas' },
  { value: 'both',       label: 'Ventas y Producción' },
  { value: 'admin',      label: 'Administrador' },
] as const

// ── Aggregated summary ──

export interface GastosSummary {
  totalFixedMonthly: number
  totalVariableFixedMonthly: number
  totalVariablePerHour: number
  totalSueldosMonthly: number
}

// ── Options ──

export const VE_CATEGORY_OPTIONS = [
  { value: 'operativo',      label: 'Operativo' },
  { value: 'administrativo', label: 'Administrativo' },
] as const

export function weeklyToMonthly(weekly: number): number {
  return weekly * (52 / 12)
}
