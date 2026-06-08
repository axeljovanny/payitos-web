import { fetchFixedCosts, fetchTeamMembersForGastos } from '@/lib/gastos/queries'
import { fetchCostBreakdowns } from '@/lib/costing/queries'
import { weeklyToMonthly } from '@/lib/gastos/types'

const WEEKS_PER_MONTH = 52 / 12       // 4.333
const PRODUCTION_DAYS_PER_MONTH = 26  // ~6 días/semana

export interface BudgetSlice {
  label: string
  amount: number
  percent: number
}

export interface DashboardData {
  // Presupuesto mensual a cubrir
  monthlyFixed: number
  monthlyLaborCurrent: number
  monthlyLaborTarget: number
  monthlyTotalCurrent: number
  monthlyTotalTarget: number
  budget: BudgetSlice[]            // sueldos + categorías de fijos, % del total actual

  // Contribución por pieza (precio − ingredientes), promedio del catálogo
  avgPrice: number
  avgIngredientCost: number
  avgContribution: number
  contributionMarginPct: number | null

  // Punto de equilibrio
  breakevenPiecesCurrent: number | null
  breakevenRevenueCurrent: number | null
  breakevenPiecesTarget: number | null
  breakevenRevenueTarget: number | null
  piecesPerWeekCurrent: number | null
  piecesPerDayCurrent: number | null

  // Diagnóstico
  productsBelowCost: string[]
  productsCounted: number
  hasFixed: boolean
  hasLabor: boolean
  hasPricedProducts: boolean
  canBreakEven: boolean
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [fixedCosts, team, breakdowns] = await Promise.all([
    fetchFixedCosts(),
    fetchTeamMembersForGastos(),
    fetchCostBreakdowns(),
  ])

  // ── Costos fijos mensuales (solo activos) ──
  const activeFixed = fixedCosts.filter((f) => f.active)
  const monthlyFixed = activeFixed.reduce((s, f) => s + Number(f.amount), 0)

  const fixedByCategory = new Map<string, number>()
  for (const f of activeFixed) {
    const cat = (f.category && f.category.trim()) || 'Otros fijos'
    fixedByCategory.set(cat, (fixedByCategory.get(cat) ?? 0) + Number(f.amount))
  }

  // ── Sueldos mensuales (actual y deseado) ──
  const activeTeam = team.filter((m) => m.active)
  const monthlyLaborCurrent = activeTeam.reduce((s, m) => s + weeklyToMonthly(m.current_weekly_wage), 0)
  const monthlyLaborTarget = activeTeam.reduce(
    (s, m) => s + weeklyToMonthly(m.target_weekly_salary ?? m.current_weekly_wage), 0
  )

  const monthlyTotalCurrent = monthlyFixed + monthlyLaborCurrent
  const monthlyTotalTarget = monthlyFixed + monthlyLaborTarget

  // ── Reparto del presupuesto (% del total actual) ──
  const budgetRaw: { label: string; amount: number }[] = []
  if (monthlyLaborCurrent > 0) budgetRaw.push({ label: 'Sueldos', amount: monthlyLaborCurrent })
  for (const [cat, amt] of fixedByCategory) budgetRaw.push({ label: cat, amount: amt })
  budgetRaw.sort((a, b) => b.amount - a.amount)
  const budget: BudgetSlice[] = budgetRaw.map((b) => ({
    ...b,
    percent: monthlyTotalCurrent > 0 ? (b.amount / monthlyTotalCurrent) * 100 : 0,
  }))

  // ── Contribución promedio por pieza ──
  const priced = breakdowns.filter(
    (b) => b.product.sale_price > 0 && b.cost_per_piece != null
  )
  const productsBelowCost = priced
    .filter((b) => (b.cost_per_piece as number) >= b.product.sale_price)
    .map((b) => b.product.name)

  const productsCounted = priced.length
  const avgPrice = productsCounted > 0
    ? priced.reduce((s, b) => s + b.product.sale_price, 0) / productsCounted
    : 0
  const avgIngredientCost = productsCounted > 0
    ? priced.reduce((s, b) => s + (b.cost_per_piece as number), 0) / productsCounted
    : 0
  const avgContribution = avgPrice - avgIngredientCost
  const contributionMarginPct = avgPrice > 0 ? (avgContribution / avgPrice) * 100 : null

  // ── Punto de equilibrio ──
  const canBreakEven = avgContribution > 0
  const beCurrent = canBreakEven ? monthlyTotalCurrent / avgContribution : null
  const beTarget = canBreakEven ? monthlyTotalTarget / avgContribution : null

  const breakevenPiecesCurrent = beCurrent != null ? Math.ceil(beCurrent) : null
  const breakevenPiecesTarget = beTarget != null ? Math.ceil(beTarget) : null
  const breakevenRevenueCurrent = breakevenPiecesCurrent != null ? breakevenPiecesCurrent * avgPrice : null
  const breakevenRevenueTarget = breakevenPiecesTarget != null ? breakevenPiecesTarget * avgPrice : null

  return {
    monthlyFixed,
    monthlyLaborCurrent,
    monthlyLaborTarget,
    monthlyTotalCurrent,
    monthlyTotalTarget,
    budget,
    avgPrice,
    avgIngredientCost,
    avgContribution,
    contributionMarginPct,
    breakevenPiecesCurrent,
    breakevenRevenueCurrent,
    breakevenPiecesTarget,
    breakevenRevenueTarget,
    piecesPerWeekCurrent: breakevenPiecesCurrent != null ? Math.ceil(breakevenPiecesCurrent / WEEKS_PER_MONTH) : null,
    piecesPerDayCurrent: breakevenPiecesCurrent != null ? Math.ceil(breakevenPiecesCurrent / PRODUCTION_DAYS_PER_MONTH) : null,
    productsBelowCost,
    productsCounted,
    hasFixed: monthlyFixed > 0,
    hasLabor: monthlyLaborCurrent > 0,
    hasPricedProducts: productsCounted > 0,
    canBreakEven,
  }
}
