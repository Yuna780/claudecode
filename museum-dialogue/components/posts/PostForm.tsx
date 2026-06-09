'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/lib/types'
import Button from '@/components/ui/Button'

interface PostFormProps {
  exhibitionId: string
  postId?: string
  initialContent?: string
  initialPrompt1?: string
  initialPrompt2?: string
  initialPrompt3?: string
  onSaved: (post: Post) => void
  onCancel?: () => void
}

const PROMPTS = [
  { key: 'prompt1', label: '一番印象に残った作品は？' },
  { key: 'prompt2', label: 'それはなぜですか？' },
  { key: 'prompt3', label: '他の来場者の意見で、見方が変わりましたか？' },
] as const

export default function PostForm({
  exhibitionId, postId,
  initialContent = '',
  initialPrompt1 = '', initialPrompt2 = '', initialPrompt3 = '',
  onSaved, onCancel
}: PostFormProps) {
  const [content, setContent] = useState(initialContent)
  const [prompt1, setPrompt1] = useState(initialPrompt1)
  const [prompt2, setPrompt2] = useState(initialPrompt2)
  const [prompt3, setPrompt3] = useState(initialPrompt3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const promptSetters = [setPrompt1, setPrompt2, setPrompt3]
  const promptValues = [prompt1, prompt2, prompt3]

  const hasContent = content.trim() || prompt1.trim() || prompt2.trim() || prompt3.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasContent) return
    setLoading(true)
    setError(null)

    const payload = {
      content,
      prompt1: prompt1 || null,
      prompt2: prompt2 || null,
      prompt3: prompt3 || null,
    }

    if (postId) {
      const { data, error: err } = await supabase
        .from('posts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select('*')
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      if (data) onSaved(data as Post)
    } else {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) { setError('ログインが必要です'); setLoading(false); return }
      const { data, error: insertErr } = await supabase
        .from('posts')
        .insert({ exhibition_id: exhibitionId, user_id: user.id, ...payload })
        .select('*')
        .single()
      if (insertErr) { setError(insertErr.message); setLoading(false); return }
      if (data) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        onSaved({ ...data, profile } as Post)
        setContent('')
        setPrompt1('')
        setPrompt2('')
        setPrompt3('')
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

      {/* 振り返りプロンプト */}
      <div className="space-y-3">
        {PROMPTS.map((prompt, i) => (
          <div key={prompt.key} className="bg-gray-50 rounded-xl p-3">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Q{i + 1}. {prompt.label}
            </label>
            <textarea
              value={promptValues[i]}
              onChange={e => promptSetters[i](e.target.value)}
              placeholder="（任意）"
              rows={2}
              className="w-full text-sm text-gray-800 placeholder-gray-300 bg-transparent resize-none focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* 自由記述 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">その他・自由感想</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="その他、感じたことを自由に書いてください..."
          rows={2}
          className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>キャンセル</Button>
        )}
        <Button type="submit" loading={loading} disabled={!hasContent}>
          {postId ? '更新する' : '投稿する'}
        </Button>
      </div>
    </form>
  )
}
