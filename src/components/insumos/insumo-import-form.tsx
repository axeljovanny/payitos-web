'use client'

import { useState, useRef, useActionState } from 'react'
import { bulkImportInsumos } from '@/lib/ingredientes/import-action'
import type { ParsedRow, BulkImportResult } from '@/lib/ingredientes/import-types'

export interface PreviewRow extends ParsedRow {
  rowIndex: number
  errors: string[]
  isExisting?: boolean
}

const REQUIRED_COLS = ['name', 'base_unit']
const UNIT_OPTIONS = ['g', 'kg', 'mg', 'ml', 'l', 'lt', 'pza', 'taza', 'cdita', 'cda']

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  })
}

function parseJSON(text: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function validateRows(rawRows: Record<string, unknown>[]): PreviewRow[] {
  return rawRows.map((raw, i) => {
    const row: PreviewRow = {
      rowIndex: i + 2,
      name: String(raw.name ?? '').trim(),
      base_unit: String(raw.base_unit ?? '').trim(),
      errors: [],
    }

    if (!row.name) row.errors.push('nombre requerido')
    if (!row.base_unit) row.errors.push('unidad base requerida')
    if (row.base_unit && !UNIT_OPTIONS.includes(row.base_unit))
      row.errors.push(`unidad base inválida (acepta: ${UNIT_OPTIONS.join(', ')})`)

    if (raw.supplier_name) row.supplier_name = String(raw.supplier_name).trim()
    if (raw.min_stock_target != null) row.min_stock_target = Number(raw.min_stock_target)

    const hasPriceData = raw.presentation_name || raw.purchase_price || raw.presentation_quantity || raw.presentation_unit

    if (hasPriceData) {
      row.presentation_name = String(raw.presentation_name ?? '').trim()
      row.presentation_quantity = Number(raw.presentation_quantity)
      row.presentation_unit = String(raw.presentation_unit ?? '').trim()
      row.purchase_price = Number(raw.purchase_price)

      if (!row.presentation_name) row.errors.push('presentation_name requerido si se envía precio')
      if (!(row.presentation_quantity > 0)) row.errors.push('presentation_quantity debe ser > 0')
      if (!row.presentation_unit) row.errors.push('presentation_unit requerida')
      if (row.presentation_unit && !UNIT_OPTIONS.includes(row.presentation_unit))
        row.errors.push(`presentation_unit inválida`)
      if (!(row.purchase_price >= 0)) row.errors.push('purchase_price inválido')

      if (raw.effective_from) row.effective_from = String(raw.effective_from).trim()
    }

    return row
  })
}

type ImportState = { error: string | null; result?: BulkImportResult }
const initState: ImportState = { error: null }

export default function InsumoImportForm() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [state, formAction, pending] = useActionState(bulkImportInsumos, initState)

  function handleFile(file: File) {
    setParseError('')
    setPreview(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      let rawRows: Record<string, unknown>[]
      if (file.name.endsWith('.json')) {
        rawRows = parseJSON(text)
        if (!rawRows.length) {
          setParseError('El JSON no contiene un array de objetos.')
          return
        }
      } else {
        rawRows = parseCSV(text) as Record<string, unknown>[]
        if (!rawRows.length) {
          setParseError('El CSV está vacío o mal formateado.')
          return
        }
        const firstRow = rawRows[0]
        for (const col of REQUIRED_COLS) {
          if (!(col in firstRow)) {
            setParseError(`El CSV no tiene la columna requerida: "${col}".`)
            return
          }
        }
      }
      setPreview(validateRows(rawRows))
    }
    reader.readAsText(file, 'utf-8')
  }

  const validRows = preview?.filter((r) => r.errors.length === 0) ?? []
  const errorRows = preview?.filter((r) => r.errors.length > 0) ?? []

  if (state.result && !state.error) {
    const { created, priceAdded, skipped, errors } = state.result
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
          <p className="font-semibold text-green-800 text-base mb-2">Importación completada</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>Insumos creados: <strong>{created}</strong></li>
            <li>Precios agregados: <strong>{priceAdded}</strong></li>
            <li>Filas omitidas (ya existían sin cambios): <strong>{skipped}</strong></li>
          </ul>
        </div>
        {errors.length > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-semibold text-red-700 mb-2">Errores en {errors.length} fila(s):</p>
            <ul className="text-xs text-red-600 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={() => { setPreview(null); setFileName(''); if (fileRef.current) fileRef.current.value = '' }}
          className="w-full rounded-xl border border-gray-300 text-gray-600 font-medium py-3 text-sm hover:bg-gray-50 transition-colors"
        >
          Importar otro archivo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Zona de carga ── */}
      {!preview && (
        <div>
          <label
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-10 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="w-10 h-10 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Elige un archivo CSV o JSON</p>
              <p className="text-xs text-gray-400 mt-1">Columnas: name, base_unit, supplier_name, presentation_name, presentation_quantity, presentation_unit, purchase_price, effective_from</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </label>

          {parseError && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{parseError}</p>
          )}

          {/* ── Template de referencia ── */}
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver ejemplo CSV</summary>
            <pre className="mt-2 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 overflow-x-auto">{`name,base_unit,supplier_name,presentation_name,presentation_quantity,presentation_unit,purchase_price,effective_from
Harina,kg,Molino SA,Costal 50 kg,50,kg,280,2026-01-15
Azúcar,kg,,Costal 50 kg,50,kg,320,
Aceite,lt,Casa López,Garrafa 5 lt,5,lt,190,2026-02-01`}</pre>
          </details>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && !confirmed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{fileName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {validRows.length} válidas · {errorRows.length} con error · {preview.length} total
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setPreview(null); setFileName(''); if (fileRef.current) fileRef.current.value = '' }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Cambiar archivo
            </button>
          </div>

          {/* Filas válidas */}
          {validRows.length > 0 && (
            <div className="rounded-2xl border border-green-200 bg-white overflow-hidden">
              <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                <p className="text-xs font-semibold text-green-700">{validRows.length} filas válidas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Nombre</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Unidad</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Proveedor</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Presentación</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.map((r) => (
                      <tr key={r.rowIndex} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-800 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-gray-500">{r.base_unit}</td>
                        <td className="px-3 py-2 text-gray-500">{r.supplier_name ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {r.presentation_name
                            ? `${r.presentation_name} · ${r.presentation_quantity} ${r.presentation_unit}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {r.purchase_price != null ? `$${r.purchase_price}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filas con error */}
          {errorRows.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-100">
                <p className="text-xs font-semibold text-red-600">{errorRows.length} filas con error (se omitirán)</p>
              </div>
              <ul className="divide-y divide-red-50">
                {errorRows.map((r) => (
                  <li key={r.rowIndex} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-gray-700">
                      Fila {r.rowIndex}: <span className="text-gray-500">{r.name || '(sin nombre)'}</span>
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">{r.errors.join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón confirmar */}
          {validRows.length > 0 ? (
            <form action={formAction}>
              <input type="hidden" name="rows" value={JSON.stringify(validRows)} />
              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3.5 text-sm transition-colors disabled:opacity-60"
              >
                {pending ? 'Importando…' : `Confirmar importación de ${validRows.length} insumo(s)`}
              </button>
            </form>
          ) : (
            <p className="text-sm text-center text-gray-400">No hay filas válidas para importar.</p>
          )}
        </div>
      )}
    </div>
  )
}
