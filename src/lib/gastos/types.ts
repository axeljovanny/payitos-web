// ── Variable expenses (overhead cost rates: gastos operativos / administrativos) ──

export type VECategory = 'operativo' | 'administrativo'

export interface VariableExpense {
  id: string
  name: string
  category: VECategory
  amount_per_hour: number | null  // cost that scales with production hours
  amount_fixed: number | null     // flat monthly overhead amount
  active: boolean
  notes: string | null
}

// ── Fixed costs (recurring monthly overhead) ──

export interface FixedCost {
  id: string
  name: string
  category: string | null
  amount_monthly: number
  active: boolean
  notes: string | null
  effective_from: string | null
}

// ── Team members + current wage ──

export interface TeamMember {
  id: string
  name: string
  role_type: string | null
  active: boolean
  notes: string | null
  production_hours_per_week: number
  sales_hours_per_week: number
  target_weekly_salary: number | null
  current_hourly_rate: number | null  // resolved from wages table
}

// ── Aggregated summary ──

export interface GastosSummary {
  totalFixedMonthly: number
  totalVariableFixedMonthly: number
  totalVariablePerHour: number
  totalSueldosMonthly: number
}

// ── Options ──

export const VE_CATEGORY_OPTIONS: { value: VECategory; label: string; hint: string }[] = [
  { value: 'operativo', label: 'Operativo', hint: 'Gas, empaques, transporte, compras…' },
  { value: 'administrativo', label: 'Administrativo', hint: 'Internet, contador, software…' },
]

export const MONTHLY_PRODUCTION_HOURS = 160 // 20 días × 8h — ajustar cuando exista config

export function weeklyToMonthly(weekly: number): number {
  return weekly * (52 / 12)
}
