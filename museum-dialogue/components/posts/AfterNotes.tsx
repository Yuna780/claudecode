'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AfterNote } from '@/lib/types'
import { formatDate, timeAfterOriginal } from '@/lib/utils'

interface AfterNotesProps {
  postId: string
  postCreatedAt: string
  currentUserId?: string
}

export default function AfterNotes({ postId, postCreatedAt, currentUserId }: AfterNotesProps) {
  const [notes, setNotes] = useState<AfterNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('after_notes')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setNotes((data as AfterNote[]) ?? []))
  }, [postId])

  const handleAdd = async () => {
    if (!content.trim()) return
    if (!currentUserId) { setError('ログインが必要です'); return }
    setLoading(true)
    setError(null)
    const { data, error: insertError } = await supabase
      .from('after_notes')
      .insert({ post_id: postId, user_id: currentUserId, content })
      .select('*')
      .single()
    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    if (data) {
      setNotes(prev => [...prev, data as AfterNote])
      setContent('')
      setShowForm(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from('after_notes')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    if (data) setNotes(prev => prev.map(n => n.id === id ? data as AfterNote : n))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この After Note を削除しますか？')) return
    await supabase.from('after_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="mt-4 space-y-4">

      {/* エラー表示 */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* ノート一覧 */}
      {notes.length > 0 && (
        <div className="space-y-4 border-l-2 border-gray-100 pl-4">
          {notes.map((note) => (
            <div key={note.id}>
              {/* 経過時間・日付 */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="font-medium text-gray-500">
                  {timeAfterOriginal(postCreatedAt, note.created_at)}
                </span>
                <span>·</span>
                <span>{formatDate(note.created_at)}</span>
              </div>

              {/* 本文 or 編集フォーム */}
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(note.id)}
                      disabled={loading}
                      className="text-xs text-amber-700 font-medium hover:text-amber-900 disabled:opacity-40"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.user_id === currentUserId && (
                    <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(note.id); setEditContent(note.content) }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs text-red-300 hover:text-red-500"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 追記ボタン / フォーム */}
      {currentUserId && (
        <div>
          {showForm ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                {timeAfterOriginal(postCreatedAt, new Date().toISOString())} · {formatDate(new Date().toISOString())}
              </p>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="あれから気づいたこと、変わった見方、ふと思い出したこと..."
                rows={3}
                autoFocus
                className="w-full text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 placeholder-amber-300"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!content.trim() || loading}
                  className="text-xs text-amber-700 font-medium hover:text-amber-900 disabled:opacity-40"
                >
                  {loading ? '保存中...' : '追記する'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setContent(''); setError(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowForm(true) }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5 py-1"
            >
              <span>+</span>
              <span>After Note を追加</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
