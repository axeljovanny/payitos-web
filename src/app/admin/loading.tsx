export default function AdminLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-28 rounded-lg bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 rounded-xl bg-gray-100" />
          <div className="h-10 w-20 rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="h-11 w-full rounded-xl bg-gray-100" />

      {/* Cards */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-gray-200" />
            <div className="h-4 w-14 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}
