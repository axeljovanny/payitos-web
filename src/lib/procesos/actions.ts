'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  parseStepsJson, parseOutputsJson, parseComponentsJson,
  calcLaborHours, calcCalendarHours,
} from './parse'
import type { ProcessOutputInput, ProcessComponentInput, ProcessStepInput } from './types'

export type ActionState = { error: string | null }

const BASE_PATH = '/admin/procesos'

type SB = Awaited<ReturnType<typeof createClient>>

// Inserta pasos, outputs, componentes y consumidores. Asume que ya se borró lo previo.
async function saveGraph(
  supabase: SB,
  processId: string,
  steps: ProcessStepInput[],
  outputs: ProcessOutputInput[],
  components: ProcessComponentInput[],
): Promise<string | null> {
  // ── Pasos ──
  if (steps.length > 0) {
    const stepRows = steps.map((s, i) => ({
      process_id: processId,
      step_name: s.step_name,
      sequence_order: s.sequence_order || i + 1,
      duration_hours: s.duration_hours,
      workers_required: s.workers_required,
      step_type: s.step_type || 'manual',
      can_overlap: s.can_overlap,
      overlap_group: s.overlap_group,
      active: s.active !== false,
      notes: s.notes,
    }))
    const { error } = await supabase.from('process_steps').insert(stepRows)
    if (error) return error.message
  }

  // ── Outputs ── (necesitamos sus ids para mapear consumidores)
  const outputRows = outputs.map((o) => ({
    process_id: processId,
    product_id: o.product_id,
    pieces: o.pieces,
  }))
  const { data: insertedOutputs, error: outErr } = await supabase
    .from('process_outputs')
    .insert(outputRows)
    .select('id, product_id')
  if (outErr || !insertedOutputs) return outErr?.message ?? 'Error al guardar variantes.'

  const productToOutputId = new Map(insertedOutputs.map((o) => [o.product_id as string, o.id as string]))

  // ── Componentes ──
  if (components.length > 0) {
    const compRows = components.map((c) => ({
      process_id: processId,
      label: c.label,
      source_type: c.source_type,
      ingredient_id: c.ingredient_id,
      preparation_id: c.preparation_id,
      quantity: c.quantity,
      unit: c.unit,
      waste_factor_percent: c.waste_factor_percent,
      allocation_mode: c.allocation_mode,
    }))
    const { data: insertedComps, error: compErr } = await supabase
      .from('process_components')
      .insert(compRows)
      .select('id')
    if (compErr || !insertedComps) return compErr?.message ?? 'Error al guardar componentes.'

    // ── Consumidores (solo subset) con su porción ──
    const consumerRows: Array<{ component_id: string; output_id: string; weight: number }> = []
    components.forEach((c, i) => {
      if (c.allocation_mode !== 'subset') return
      const componentId = insertedComps[i].id as string
      for (const cc of c.consumers) {
        const outputId = productToOutputId.get(cc.product_id)
        if (outputId) consumerRows.push({ component_id: componentId, output_id: outputId, weight: cc.weight > 0 ? cc.weight : 1 })
      }
    })
    if (consumerRows.length > 0) {
      const { error: consErr } = await supabase.from('process_component_consumers').insert(consumerRows)
      if (consErr) return consErr.message
    }
  }

  return null
}

function readForm(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const cooking_type = (formData.get('cooking_type') as string) || 'otro'
  const notes = (formData.get('notes') as string)?.trim() || null

  const steps = parseStepsJson(formData.get('steps_json') as string)
  const outputs = parseOutputsJson(formData.get('outputs_json') as string)
  const components = parseComponentsJson(formData.get('components_json') as string)

  return { name, cooking_type, notes, steps, outputs, components }
}

function validate(
  name: string | undefined,
  steps: ProcessStepInput[] | null,
  outputs: ProcessOutputInput[] | null,
  components: ProcessComponentInput[] | null,
): string | null {
  if (!name) return 'El nombre del proceso es requerido.'
  if (steps === null) return 'Datos de pasos inválidos.'
  if (outputs === null) return 'Datos de variantes inválidos.'
  if (components === null) return 'Datos de componentes inválidos.'
  if (outputs.length === 0) return 'Agrega al menos una variante (producto producido).'
  const seen = new Set<string>()
  for (const o of outputs) {
    if (seen.has(o.product_id)) return 'Hay productos repetidos en las variantes.'
    seen.add(o.product_id)
  }
  return null
}

export async function createProcess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { name, cooking_type, notes, steps, outputs, components } = readForm(formData)
  const err = validate(name, steps, outputs, components)
  if (err) return { error: err }

  const laborHours = calcLaborHours(steps!)
  const calendarHours = calcCalendarHours(steps!)

  const supabase = await createClient()
  const { data: proc, error } = await supabase
    .from('processes')
    .insert({
      name,
      cooking_type,
      notes,
      active: true,
      labor_hours_per_batch: laborHours > 0 ? laborHours : null,
      calendar_time_hours: calendarHours > 0 ? calendarHours : null,
    })
    .select('id').single()
  if (error || !proc) return { error: error?.message ?? 'Error al crear el proceso.' }

  const graphErr = await saveGraph(supabase, proc.id, steps!, outputs!, components!)
  if (graphErr) {
    await supabase.from('processes').delete().eq('id', proc.id)
    return { error: graphErr }
  }

  revalidatePath(BASE_PATH)
  redirect(BASE_PATH)
}

export async function updateProcess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id') as string
  const { name, cooking_type, notes, steps, outputs, components } = readForm(formData)
  const err = validate(name, steps, outputs, components)
  if (!id) return { error: 'Falta el id del proceso.' }
  if (err) return { error: err }

  const laborHours = calcLaborHours(steps!)
  const calendarHours = calcCalendarHours(steps!)

  const supabase = await createClient()
  const { error: upErr } = await supabase
    .from('processes')
    .update({
      name,
      cooking_type,
      notes,
      active: true,
      labor_hours_per_batch: laborHours > 0 ? laborHours : null,
      calendar_time_hours: calendarHours > 0 ? calendarHours : null,
    })
    .eq('id', id)
  if (upErr) return { error: upErr.message }

  // Reemplazo total del grafo (cascade limpia consumers al borrar componentes/outputs)
  await supabase.from('process_components').delete().eq('process_id', id)
  await supabase.from('process_outputs').delete().eq('process_id', id)
  await supabase.from('process_steps').delete().eq('process_id', id)

  const graphErr = await saveGraph(supabase, id, steps!, outputs!, components!)
  if (graphErr) return { error: graphErr }

  revalidatePath(BASE_PATH)
  revalidatePath(`${BASE_PATH}/${id}/editar`)
  redirect(BASE_PATH)
}

export async function deleteProcess(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('process_components').delete().eq('process_id', id)
  await supabase.from('process_outputs').delete().eq('process_id', id)
  await supabase.from('process_steps').delete().eq('process_id', id)
  await supabase.from('processes').delete().eq('id', id)
  revalidatePath(BASE_PATH)
  redirect(BASE_PATH)
}

export async function reactivateProcess(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('processes').update({ active: true }).eq('id', id)
  revalidatePath(BASE_PATH)
}
