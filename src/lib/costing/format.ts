export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// For unit prices that may be sub-peso (e.g. $0.0062/g) — shows up to 4 decimals
export function formatUnitPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Handles both date-only strings ("2024-01-15") and full ISO timestamps ("2024-01-15T20:00:00+00:00")
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = iso.includes('T') ? new Date(iso) : new Date(iso + 'T12:00:00Z')
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'g',     label: 'Gramos (g)' },
  { value: 'Kg',    label: 'Kilogramos (kg)' },
  { value: 'ml',    label: 'Mililitros (ml)' },
  { value: 'Lt',    label: 'Litros (lt)' },
  { value: 'Pza',   label: 'Pieza (pza)' },
  { value: 'Cda',   label: 'Cucharada (cda)' },
]
