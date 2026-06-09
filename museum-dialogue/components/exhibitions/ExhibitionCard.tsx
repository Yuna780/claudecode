import Link from 'next/link'
import Image from 'next/image'
import { Exhibition } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const now = new Date()
  const end = new Date(exhibition.end_date)
  const isActive = end >= now

  return (
    <Link href={`/exhibitions/${exhibition.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-100">
        {exhibition.image_url ? (
          <Image
            src={exhibition.image_url}
            alt={exhibition.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼</div>
        )}
        <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isActive ? '開催中' : '終了'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{exhibition.title}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{exhibition.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>📍 {exhibition.location}</span>
          <span>{formatDate(exhibition.start_date)} 〜 {formatDate(exhibition.end_date)}</span>
        </div>
      </div>
    </Link>
  )
}
