'use client'

import { useActionState } from 'react'
import { createCategory } from '@/lib/ingredientes/actions'
import type { ActionState } from '@/lib/ingredientes/actions'

export default function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, { error: null } as ActionState)

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="ej. Harinas, Lácteos, Grasas…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? '…' : 'Agregar'}
        </button>
      </form>
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
    </div>
  )
}
