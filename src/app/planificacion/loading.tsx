export default function PlanificacionLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page header */}
      <div className="space-y-1.5">
        <div className="h-6 w-28 rounded-lg bg-gray-200" />
        <div className="h-4 w-36 rounded bg-gray-100" />
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="h-7 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* List section */}
      <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
        <div className="h-5 w-24 rounded bg-gray-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-t border-gray-50">
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
