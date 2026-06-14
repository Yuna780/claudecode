import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`
  return formatDate(dateString)
}

// 元の投稿からどれくらい後に書かれたか
export function timeAfterOriginal(originalDate: string, noteDate: string): string {
  const origin = new Date(originalDate).getTime()
  const note = new Date(noteDate).getTime()
  const diff = note - origin
  if (diff < 0) return '同日'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '当日に追記'
  if (days < 7) return `${days}日後に追記`
  if (days < 30) return `${Math.floor(days / 7)}週間後に追記`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}ヶ月後に追記`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (remMonths === 0) return `${years}年後に追記`
  return `${years}年${remMonths}ヶ月後に追記`
}
