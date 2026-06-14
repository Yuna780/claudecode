import Link from 'next/link'
import Image from 'next/image'
import { Exhibition } from '@/lib/types'
import { formatDate } from '@/lib/utils'

function StatusBadge({ start_date, end_date }: { start_date: string | null; end_date: string | null }) {
  if (!end_date) return null
  const isActive = new Date(end_date) >= new Date()
  return (
    <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {isActive ? '開催中' : '終了'}
    </span>
  )
}

function DateRange({ start_date, end_date }: { start_date: string | null; end_date: string | null }) {
  if (!start_date && !end_date) return null
  if (start_date && end_date) return <span>{formatDate(start_date)} 〜 {formatDate(end_date)}</span>
  if (start_date) return <span>{formatDate(start_date)} 〜</span>
  if (end_date) return <span>〜 {formatDate(end_date)}</span>
  return null
}

export default function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  return (
    <Link href={`/exhibitions/${exhibition.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-100">
        {exhibition.image_url ? (
          <Image
            src={exhibition.image_url}
            alt={exhibition.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼</div>
        )}
        <StatusBadge start_date={exhibition.start_date} end_date={exhibition.end_date} />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{exhibition.title}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{exhibition.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {(exhibition.location || exhibition.city) && (
            <span>📍 {[exhibition.location, exhibition.city].filter(Boolean).join('・')}</span>
          )}
          <DateRange start_date={exhibition.start_date} end_date={exhibition.end_date} />
        </div>
      </div>
    </Link>
  )
}
