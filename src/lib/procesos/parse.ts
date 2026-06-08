// Parsers puros (sin 'use server') — compartidos por el form y las server actions.

import type { ProcessStepInput, ProcessOutputInput, ProcessComponentInput } from './types'

export function calcLaborHours(steps: ProcessStepInput[]): number {
  return steps
    .filter((s) => s.active && s.duration_hours > 0)
    .reduce((sum, s) => sum + s.duration_hours * s.workers_required, 0)
}

export function calcCalendarHours(steps: ProcessStepInput[]): number {
  const active = steps.filter((s) => s.active && s.duration_hours > 0)
  if (active.length === 0) return 0
  let cal = 0
  const groups = new Map<string, number>()
  for (const s of active) {
    if (s.can_overlap && s.overlap_group) {
      const prev = groups.get(s.overlap_group) ?? 0
      groups.set(s.overlap_group, Math.max(prev, s.duration_hours))
    } else {
      cal += s.duration_hours
    }
  }
  for (const v of groups.values()) cal += v
  return Math.round(cal * 100) / 100
}

export function parseStepsJson(json: string | null): ProcessStepInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed.map((row, i) => {
      const r = row as Record<string, unknown>
      return {
        step_name: String(r.step_name ?? '').trim(),
        sequence_order: Number(r.sequence_order ?? i + 1),
        duration_hours: Number(r.duration_hours ?? 0),
        workers_required: Number(r.workers_required ?? 1),
        step_type: String(r.step_type ?? 'manual'),
        can_overlap: Boolean(r.can_overlap),
        overlap_group: r.overlap_group ? String(r.overlap_group) : null,
        active: r.active !== false,
        notes: r.notes ? String(r.notes) : null,
      }
    })
  } catch {
    return null
  }
}

export function parseOutputsJson(json: string | null): ProcessOutputInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed
      .map((row) => {
        const r = row as Record<string, unknown>
        return {
          product_id: String(r.product_id ?? ''),
          pieces: Number(r.pieces ?? 0),
        }
      })
      .filter((o) => o.product_id && o.pieces > 0)
  } catch {
    return null
  }
}

export function parseComponentsJson(json: string | null): ProcessComponentInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed
      .map((row) => {
        const r = row as Record<string, unknown>
        const source_type = r.source_type === 'preparation' ? 'preparation' : 'ingredient'
        const allocation_mode = r.allocation_mode === 'subset' ? 'subset' : 'all'
        const consumers = Array.isArray(r.consumers)
          ? (r.consumers as unknown[])
              .map((c) => {
                const cc = c as Record<string, unknown>
                return { product_id: String(cc.product_id ?? ''), weight: Number(cc.weight ?? 1) || 1 }
              })
              .filter((c) => c.product_id)
          : []
        return {
          label: r.label ? String(r.label) : null,
          source_type,
          ingredient_id: source_type === 'ingredient' ? (r.ingredient_id ? String(r.ingredient_id) : null) : null,
          preparation_id: source_type === 'preparation' ? (r.preparation_id ? String(r.preparation_id) : null) : null,
          quantity: Number(r.quantity ?? 0),
          unit: String(r.unit ?? ''),
          waste_factor_percent: Number(r.waste_factor_percent ?? 0),
          allocation_mode,
          consumers: allocation_mode === 'subset' ? consumers : [],
        } as ProcessComponentInput
      })
      .filter((c) =>
        (c.source_type === 'ingredient' ? !!c.ingredient_id : !!c.preparation_id) &&
        c.quantity > 0 && !!c.unit
      )
  } catch {
    return null
  }
}
