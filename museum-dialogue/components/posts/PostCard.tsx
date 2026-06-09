'use client'

import { useState } from 'react'
import { Post } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import PostForm from './PostForm'
import CommentSection from '@/components/comments/CommentSection'
import AfterNotes from './AfterNotes'

interface PostCardProps {
  post: Post
  currentUserId?: string
  onDeleted: (id: string) => void
  onUpdated: (post: Post) => void
}

export default function PostCard({ post, currentUserId, onDeleted, onUpdated }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [editing, setEditing] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const supabase = createClient()

  const handleLike = async () => {
    if (!currentUserId) return
    if (liked) {
      await supabase.from('likes').delete().match({ post_id: post.id, user_id: currentUserId })
      setLiked(false)
      setLikesCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId })
      setLiked(true)
      setLikesCount(c => c + 1)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted(post.id)
  }

  const PROMPT_LABELS = [
    '一番印象に残った作品は？',
    'それはなぜですか？',
    '他の来場者の意見で、見方が変わりましたか？',
  ]
  const promptAnswers = [post.prompt1, post.prompt2, post.prompt3]

  if (editing) {
    return (
      <PostForm
        exhibitionId={post.exhibition_id}
        initialContent={post.content}
        initialPrompt1={post.prompt1 ?? ''}
        initialPrompt2={post.prompt2 ?? ''}
        initialPrompt3={post.prompt3 ?? ''}
        postId={post.id}
        onSaved={updated => { onUpdated(updated); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {post.profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{post.profile?.username ?? '匿名'}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {currentUserId === post.user_id && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">編集</button>
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">削除</button>
          </div>
        )}
      </div>

      {/* 振り返りプロンプト回答 */}
      {promptAnswers.some(a => a) && (
        <div className="space-y-2 mb-3">
          {promptAnswers.map((answer, i) =>
            answer ? (
              <div key={i} className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-gray-400 mb-0.5">Q{i + 1}. {PROMPT_LABELS[i]}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* 自由感想 */}
      {post.content && (
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'} ${!currentUserId ? 'cursor-default' : ''}`}
        >
          {liked ? '♥' : '♡'} <span>{likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          💬 <span>{post.comments_count ?? 0}</span>
        </button>
      </div>
      {showComments && (
        <div className="mt-4">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}

      {/* After Notes */}
      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">After Notes</p>
        <AfterNotes
          postId={post.id}
          postCreatedAt={post.created_at}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  )
}
