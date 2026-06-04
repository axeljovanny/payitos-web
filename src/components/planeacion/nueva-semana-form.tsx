'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/planeacion/actions'

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  basePath?: string
}

export default function NuevaSemanaForm({ action, basePath = '/panadero/planeacion' }: Props) {
  const [state, dispatch, pending] = useActionState(action, { error: null })

  return (
    <form action={dispatch} className="space-y-5">
      <input type="hidden" name="return_path" value={basePath} />
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="space-y-1.5">
          <label
            htmlFor="week_start"
            className="block text-sm font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Fecha de inicio de semana
          </label>
          <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
            Selecciona cualquier día — se ajustará al lunes de esa semana.
          </p>
          <input
            id="week_start"
            name="week_start"
            type="date"
            required
            className="w-full rounded-xl px-3.5 py-3 text-base transition-[box-shadow] focus:outline-none"
            style={{
              background: 'var(--background)',
              border: '1.5px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {state.error && (
          <p
            className="text-sm rounded-xl px-3.5 py-2.5"
            style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
          >
            {state.error}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={basePath}
          className="flex-1 text-center rounded-xl text-sm font-semibold px-4 py-3 transition-colors"
          style={{ background: 'var(--border-subtle)', color: 'var(--ink-muted)' }}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl text-sm font-bold px-4 py-3 transition-[transform,box-shadow] active:scale-[0.97] disabled:opacity-60"
          style={{
            background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
            color: '#ffffe9',
            boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
          }}
        >
          {pending ? 'Creando...' : 'Crear planeación'}
        </button>
      </div>
    </form>
  )
}
