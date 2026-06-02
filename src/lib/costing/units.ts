// Unit conversion helpers — shared by client components (cost preview) and server actions (DB insert).
// No Node.js-specific imports; safe to use anywhere.

export type ConversionResult =
  | { ok: true; value: number }
  | { ok: false; error: string }

// Multipliers relative to the base unit for each family
const WEIGHT_IN_G: Record<string, number> = { mg: 0.001, g: 1, kg: 1000 }
const VOLUME_IN_ML: Record<string, number> = { ml: 1, cl: 10, dl: 100, l: 1000, lt: 1000 }
const PIECE_UNITS = new Set(['pza', 'pz', 'pieza', 'piezas', 'ud', 'unidad', 'unidades'])

export function convertUnit(qty: number, from: string, to: string): ConversionResult {
  const f = from.toLowerCase().trim()
  const t = to.toLowerCase().trim()

  if (f === t) return { ok: true, value: qty }

  // Weight family
  if (f in WEIGHT_IN_G && t in WEIGHT_IN_G) {
    return { ok: true, value: (qty * WEIGHT_IN_G[f]) / WEIGHT_IN_G[t] }
  }

  // Volume family
  if (f in VOLUME_IN_ML && t in VOLUME_IN_ML) {
    return { ok: true, value: (qty * VOLUME_IN_ML[f]) / VOLUME_IN_ML[t] }
  }

  // Piece family — same conceptual unit, allow
  if (PIECE_UNITS.has(f) && PIECE_UNITS.has(t)) {
    return { ok: true, value: qty }
  }

  return {
    ok: false,
    error: `Sin conversión de "${from}" a "${to}" — son categorías distintas (peso, volumen, pieza)`,
  }
}

// Calculate unit_price (per 1 base_unit) from a purchase presentation.
// purchasePrice: what you paid for the whole presentation
// presentationQty + presentationUnit: how much you bought
// baseUnit: the ingredient's base unit (stored in ingredients.base_unit)
export function calcUnitPriceFromPresentation(
  purchasePrice: number,
  presentationQty: number,
  presentationUnit: string,
  baseUnit: string,
): ConversionResult {
  if (presentationQty <= 0) {
    return { ok: false, error: 'La cantidad de presentación debe ser mayor a 0' }
  }
  const result = convertUnit(presentationQty, presentationUnit, baseUnit)
  if (!result.ok) return result
  if (result.value <= 0) return { ok: false, error: 'Resultado de conversión es 0' }
  return { ok: true, value: purchasePrice / result.value }
}

// Calculate the cost of one recipe ingredient line.
// quantity + unit: as entered in recipe_ingredients
// wasteFactorPercent: merma (0–100)
// unitPrice: from ingredient_price_history.unit_price (per 1 baseUnit)
// baseUnit: ingredient's base_unit
export function calcLineCost(
  quantity: number,
  unit: string,
  wasteFactorPercent: number,
  unitPrice: number,
  baseUnit: string,
): ConversionResult {
  const conv = convertUnit(quantity, unit, baseUnit)
  if (!conv.ok) return conv
  const effectiveQty = conv.value * (1 + wasteFactorPercent / 100)
  return { ok: true, value: effectiveQty * unitPrice }
}
