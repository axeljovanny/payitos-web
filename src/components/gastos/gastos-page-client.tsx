'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { VariableExpense, FixedCost, TeamMember } from '@/lib/gastos/types'
import { VE_CATEGORY_OPTIONS, weeklyToMonthly } from '@/lib/gastos/types'
import {
  deleteVariableExpense,
  deactivateFixedCost, reactivateFixedCost, deleteFixedCost,
  deactivateTeamMember, reactivateTeamMember, deleteTeamMember,
} from '@/lib/gastos/actions'
import { formatMXN, formatDate } from '@/lib/costing/format'

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable expense card
// ─────────────────────────────────────────────────────────────────────────────

function VariableExpenseCard({ item }: { item: VariableExpense }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`bg-white rounded-2xl border transition-shadow ${
      open ? 'border-pink-200 shadow-md' : 'border-gray-200 shadow-sm'
    }`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-800 truncate">{item.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.expense_date)}</p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800 tabular-nums">{formatMXN(item.amount)}</span>
          <span className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown />
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          {item.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notas</p>
              <p className="text-sm text-gray-600">{item.notes}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href={`/admin/gastos/variable/${item.id}/editar`}
              className="w-full text-center rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white font-semibold py-3 text-sm transition-colors"
            >
              Editar gasto
            </Link>
            <form action={deleteVariableExpense}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="w-full rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium py-3 text-sm transition-colors">
                Eliminar registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixed cost card
// ─────────────────────────────────────────────────────────────────────────────

function FixedCostCard({ item }: { item: FixedCost }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`bg-white rounded-2xl border transition-shadow ${
      item.active
        ? open ? 'border-pink-200 shadow-md' : 'border-gray-200 shadow-sm'
        : 'border-gray-100 opacity-60'
    }`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-800 truncate">{item.name}</p>
          {item.category && (
            <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
          )}
          {!item.active && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">inactivo</span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-gray-800 tabular-nums">{formatMXN(item.amount)}</p>
            <p className="text-xs text-gray-400">mensual</p>
          </div>
          <span className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown />
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          {item.effective_from && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vigente desde</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(item.effective_from)}</p>
            </div>
          )}
          {item.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notas</p>
              <p className="text-sm text-gray-600">{item.notes}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-1">
            {item.active ? (
              <>
                <Link
                  href={`/admin/gastos/fijos/${item.id}/editar`}
                  className="w-full text-center rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white font-semibold py-3 text-sm transition-colors"
                >
                  Editar gasto fijo
                </Link>
                <form action={deactivateFixedCost}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="w-full rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 text-sm transition-colors">
                    Desactivar
                  </button>
                </form>
              </>
            ) : (
              <form action={reactivateFixedCost}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="w-full rounded-xl border border-pink-300 text-[#d43a6a] hover:bg-pink-50 font-medium py-3 text-sm transition-colors">
                  Reactivar
                </button>
              </form>
            )}
            <form action={deleteFixedCost}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="w-full rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium py-3 text-sm transition-colors">
                Eliminar registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Team member card
// ─────────────────────────────────────────────────────────────────────────────

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)

  const currentMonthly = weeklyToMonthly(member.current_weekly_wage)

  return (
    <div className={`bg-white rounded-2xl border transition-shadow ${
      member.active
        ? open ? 'border-pink-200 shadow-md' : 'border-gray-200 shadow-sm'
        : 'border-gray-100 opacity-60'
    }`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-800 truncate">{member.name}</p>
          {member.role_type && (
            <p className="text-xs text-gray-400 mt-0.5">{member.role_type}</p>
          )}
          {!member.active && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">inactivo</span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            {member.current_weekly_wage > 0 ? (
              <>
                <p className="text-base font-bold text-gray-800 tabular-nums">{formatMXN(member.current_weekly_wage)}</p>
                <p className="text-xs text-gray-400">por semana</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">sin sueldo</p>
            )}
          </div>
          <span className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown />
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {member.current_weekly_wage > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Equivalente mensual</p>
                <p className="text-sm font-medium text-gray-700">{formatMXN(currentMonthly)}/mes</p>
              </div>
            )}
            {currentMonthly != null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Equivalente mensual</p>
                <p className="text-sm font-medium text-gray-700">{formatMXN(currentMonthly)}/mes</p>
              </div>
            )}
            {(member.production_hours_per_week > 0 || member.sales_hours_per_week > 0) && (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Hrs producción/sem</p>
                  <p className="text-sm font-medium text-gray-700">{member.production_hours_per_week}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Hrs venta/sem</p>
                  <p className="text-sm font-medium text-gray-700">{member.sales_hours_per_week}h</p>
                </div>
              </>
            )}
            {member.target_weekly_salary != null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sueldo objetivo/sem</p>
                <p className="text-sm font-medium text-gray-700">{formatMXN(member.target_weekly_salary)}</p>
              </div>
            )}
            {member.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Notas</p>
                <p className="text-sm text-gray-600">{member.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {member.active ? (
              <>
                <Link
                  href={`/admin/gastos/integrantes/${member.id}/editar`}
                  className="w-full text-center rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white font-semibold py-3 text-sm transition-colors"
                >
                  Editar integrante
                </Link>
                <form action={deactivateTeamMember}>
                  <input type="hidden" name="id" value={member.id} />
                  <button type="submit" className="w-full rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 text-sm transition-colors">
                    Desactivar
                  </button>
                </form>
              </>
            ) : (
              <form action={reactivateTeamMember}>
                <input type="hidden" name="id" value={member.id} />
                <button type="submit" className="w-full rounded-xl border border-pink-300 text-[#d43a6a] hover:bg-pink-50 font-medium py-3 text-sm transition-colors">
                  Reactivar
                </button>
              </form>
            )}
            <form action={deleteTeamMember}>
              <input type="hidden" name="id" value={member.id} />
              <button type="submit" className="w-full rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium py-3 text-sm transition-colors">
                Eliminar registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ label, href }: { label: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center space-y-3">
      <p className="text-sm text-gray-500">Sin registros.</p>
      <Link href={href} className="inline-block rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white font-semibold px-5 py-2.5 text-sm transition-colors">
        {label}
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page client
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'operativo' | 'administrativo' | 'fijos' | 'equipo'

const TABS: { id: Tab; label: string }[] = [
  { id: 'operativo', label: 'Operativos' },
  { id: 'administrativo', label: 'Administrativos' },
  { id: 'fijos', label: 'Fijos' },
  { id: 'equipo', label: 'Equipo' },
]

interface Props {
  variableExpenses: VariableExpense[]
  fixedCosts: FixedCost[]
  teamMembers: TeamMember[]
}

export default function GastosPageClient({ variableExpenses, fixedCosts, teamMembers }: Props) {
  const [tab, setTab] = useState<Tab>('operativo')

  const operativos = variableExpenses.filter((e) => e.category === 'operativo')
  const administrativos = variableExpenses.filter((e) => e.category === 'administrativo')
  const activosFijos = fixedCosts.filter((f) => f.active)
  const activosEquipo = teamMembers.filter((m) => m.active)

  // Variable expenses: sum for the current calendar month
  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalVarThisMonth = variableExpenses
    .filter((e) => e.expense_date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)

  const totalFijosMonthly = activosFijos.reduce((s, f) => s + f.amount, 0)
  const totalSueldos = activosEquipo.reduce((s, m) => {
    if (m.current_weekly_wage <= 0) return s
    return s + weeklyToMonthly(m.current_weekly_wage)
  }, 0)
  const totalOverhead = totalVarThisMonth + totalFijosMonthly + totalSueldos

  const tabCount = {
    operativo: operativos.length,
    administrativo: administrativos.length,
    fijos: activosFijos.length,
    equipo: activosEquipo.length,
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-[#d43a6a] uppercase tracking-wide">Overhead mensual estimado</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Variables (mes)</p>
            <p className="text-sm font-bold text-gray-800 tabular-nums">{formatMXN(totalVarThisMonth)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Fijos</p>
            <p className="text-sm font-bold text-gray-800 tabular-nums">{formatMXN(totalFijosMonthly)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Sueldos</p>
            <p className="text-sm font-bold text-gray-800 tabular-nums">{formatMXN(totalSueldos)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#d43a6a] font-semibold">Total</p>
            <p className="text-base font-bold text-[#b02558] tabular-nums">{formatMXN(totalOverhead)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-white text-[#d43a6a] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {tabCount[t.id] > 0 && (
              <span className={`ml-1 text-xs ${tab === t.id ? 'text-[#ed507c]' : 'text-gray-400'}`}>
                {tabCount[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {(tab === 'operativo' || tab === 'administrativo') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {tab === 'operativo' ? 'Gastos operativos' : 'Gastos administrativos'}
              </p>
              <p className="text-xs text-gray-400">
                {tab === 'operativo' ? 'Gas, empaques, transporte, compras…' : 'Internet, contador, software…'}
              </p>
            </div>
            <Link
              href="/admin/gastos/variable/nuevo"
              className="rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              Agregar gasto
            </Link>
          </div>

          {(tab === 'operativo' ? operativos : administrativos).length === 0 ? (
            <EmptyState label="Registrar gasto" href="/admin/gastos/variable/nuevo" />
          ) : (
            <div className="space-y-2">
              {(tab === 'operativo' ? operativos : administrativos)
                .map((item) => <VariableExpenseCard key={item.id} item={item} />)}
            </div>
          )}
        </section>
      )}

      {tab === 'fijos' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Gastos fijos</p>
              <p className="text-xs text-gray-400">Renta, luz, internet, gas…</p>
            </div>
            <Link
              href="/admin/gastos/fijos/nuevo"
              className="rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              Agregar gasto fijo
            </Link>
          </div>

          {fixedCosts.length === 0 ? (
            <EmptyState label="Agregar gasto fijo" href="/admin/gastos/fijos/nuevo" />
          ) : (
            <div className="space-y-2">
              {fixedCosts.map((item) => <FixedCostCard key={item.id} item={item} />)}
            </div>
          )}
        </section>
      )}

      {tab === 'equipo' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Equipo</p>
              <p className="text-xs text-gray-400">{activosEquipo.length} activo{activosEquipo.length !== 1 ? 's' : ''} · {formatMXN(totalSueldos)}/mes</p>
            </div>
            <Link
              href="/admin/gastos/integrantes/nuevo"
              className="rounded-xl bg-[#ed507c] hover:bg-[#d43a6a] text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              Agregar integrante
            </Link>
          </div>

          {teamMembers.length === 0 ? (
            <EmptyState label="Agregar integrante" href="/admin/gastos/integrantes/nuevo" />
          ) : (
            <div className="space-y-2">
              {teamMembers.map((m) => <TeamMemberCard key={m.id} member={m} />)}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
