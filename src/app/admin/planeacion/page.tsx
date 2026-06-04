import Link from 'next/link'
import { listWeeklyPlans, formatWeekLabel } from '@/lib/planeacion/queries'
import { deleteWeeklyPlan } from '@/lib/planeacion/actions'
import type { WeeklyPlanRow, PlanStatus } from '@/lib/planeacion/types'

const BASE = '/admin/planeacion'

const STATUS_LABELS: Record<PlanStatus, string> = {
  draft: 'Borrador',
  confirmed: 'Aprobada',
}

function PlanCard({ plan }: { plan: WeeklyPlanRow }) {
  const isDraft = plan.status === 'draft'
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Main row — tap to view */}
      <Link
        href={`${BASE}/${plan.id}`}
        className="flex items-center justify-between px-4 py-3.5 active:opacity-70"
      >
        <p className="font-bold text-base truncate" style={{ color: 'var(--foreground)' }}>
          {formatWeekLabel(plan.week_start)}
        </p>
        <span
          className="shrink-0 ml-3 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={
            isDraft
              ? { background: '#fef3c7', color: '#92400e' }
              : { background: '#dcfce7', color: '#166534' }
          }
        >
          {STATUS_LABELS[plan.status]}
        </span>
      </Link>

      {/* Action row */}
      <div
        className="flex items-center gap-1 px-3 pb-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <Link
          href={`${BASE}/${plan.id}`}
          className="flex-1 text-center text-xs font-semibold py-2 rounded-xl transition-colors"
          style={{ color: 'var(--brand-dark)', background: 'var(--brand-light)' }}
        >
          Ver detalle
        </Link>

        {isDraft && (
          <Link
            href={`${BASE}/${plan.id}/editar`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-xl transition-colors"
            style={{ color: 'var(--ink-muted)', background: 'var(--border-subtle)' }}
          >
            Editar
          </Link>
        )}

        <form action={deleteWeeklyPlan} className="flex-1">
          <input type="hidden" name="plan_id" value={plan.id} />
          <input type="hidden" name="return_path" value={BASE} />
          <button
            type="submit"
            className="w-full text-xs font-semibold py-2 rounded-xl transition-colors"
            style={{ color: '#b91c1c', background: '#fef2f2' }}
          >
            Eliminar
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function AdminPlaneacionPage() {
  const plans = await listWeeklyPlans()
  const drafts = plans.filter((p) => p.status === 'draft')
  const confirmed = plans.filter((p) => p.status === 'confirmed')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Planeación semanal
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {plans.length} semana{plans.length !== 1 ? 's' : ''} registrada
            {plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`${BASE}/nueva`}
          className="rounded-xl text-sm font-bold px-4 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
          style={{
            background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
            color: '#ffffe9',
            boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
          }}
        >
          Nueva semana
        </Link>
      </div>

      {plans.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            No hay semanas planeadas todavía.
          </p>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
            En borrador
          </p>
          {drafts.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
            Aprobadas
          </p>
          {confirmed.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}
    </div>
  )
}
