'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/exhibitions" className="text-xl font-bold tracking-tight text-gray-900">
          Museum Dialogue
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/timeline" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            タイムライン
          </Link>
          <Link href="/exhibitions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            展覧会
          </Link>
          {user ? (
            <>
              <Link href="/diary" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                日記
              </Link>
              <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                プロフィール
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
