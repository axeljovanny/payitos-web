'use client'

import { useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/user'

const TAB_ORDER: Record<UserRole, string[]> = {
  Admin: ['/admin/insumos', '/admin/productos', '/admin/gastos', '/admin/costos'],
  panadero: ['/panadero', '/panadero/recetas', '/panadero/insumos'],
  vendedor: ['/vendedor'],
  planificacion: ['/planificacion', '/planificacion/costos'],
}

const SWIPE_THRESHOLD = 60
const EDGE_ZONE = 40 // px from left edge to trigger back swipe on sub-pages

export default function SwipeNavigation({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartEdge = useRef(false)

  const tabs = TAB_ORDER[role] ?? []
  const currentTabIndex = tabs.indexOf(pathname)
  const isOnMainTab = currentTabIndex !== -1

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchStartEdge.current = touch.clientX <= EDGE_ZONE
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Ignore swipes that start on interactive elements (inputs, selects, textareas)
    const target = e.target as HTMLElement
    if (target.closest('input, select, textarea, button, a')) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartX.current
    const dy = touch.clientY - touchStartY.current

    // Must be more horizontal than vertical
    if (Math.abs(dx) < Math.abs(dy)) return
    // Must exceed threshold
    if (Math.abs(dx) < SWIPE_THRESHOLD) return

    if (isOnMainTab) {
      if (dx < 0 && currentTabIndex < tabs.length - 1) {
        // Swipe left → next tab
        router.push(tabs[currentTabIndex + 1])
      } else if (dx > 0 && currentTabIndex > 0) {
        // Swipe right → previous tab
        router.push(tabs[currentTabIndex - 1])
      }
    } else {
      // On sub-page: only allow back swipe from the left edge
      if (dx > 0 && touchStartEdge.current) {
        router.back()
      }
    }
  }

  return (
    <main
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-2xl mx-auto w-full px-4 py-5">
        {children}
      </div>
    </main>
  )
}
