export default function PanaderoLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page header */}
      <div className="space-y-1.5">
        <div className="h-6 w-32 rounded-lg bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-100" />
      </div>

      {/* Summary card */}
      <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-6 w-10 rounded bg-gray-200" />
              <div className="h-3 w-14 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Item cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-28 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}
