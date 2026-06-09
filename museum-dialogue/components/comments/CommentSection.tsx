'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

export default function CommentSection({ postId, currentUserId }: { postId: string; currentUserId?: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        if (!data) return
        const withProfiles = await Promise.all(
          data.map(async (c) => {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', c.user_id).single()
            return { ...c, profile }
          })
        )
        setComments(withProfiles as Comment[])
      })
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !currentUserId) return
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: currentUserId, content })
      .select('*')
      .single()
    if (data) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single()
      setComments(c => [...c, { ...data, profile } as Comment])
    }
    setContent('')
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id)
    setComments(c => c.filter(cm => cm.id !== id))
  }

  return (
    <div className="space-y-3">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0 mt-0.5">
            {comment.profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-gray-700">{comment.profile?.username}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
              {currentUserId === comment.user_id && (
                <button onClick={() => handleDelete(comment.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto">削除</button>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
          </div>
        </div>
      ))}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="コメントを追加..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 px-2"
          >
            送信
          </button>
        </form>
      )}
    </div>
  )
}
