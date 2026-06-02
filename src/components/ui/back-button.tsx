import Link from 'next/link'

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

interface Props {
  href: string
  label: string
}

export default function BackButton({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 -ml-1 py-1 pr-2 rounded-lg active:bg-amber-50 transition-colors"
    >
      <ChevronLeftIcon />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  )
}
