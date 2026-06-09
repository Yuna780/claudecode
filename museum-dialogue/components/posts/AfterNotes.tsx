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
    if (!content.trim() || !currentUserId) return
    setLoading(true)
    const { data } = await supabase
      .from('after_notes')
      .insert({ post_id: postId, user_id: currentUserId, content })
      .select('*')
      .single()
    if (data) {
      setNotes(prev => [...prev, data as AfterNote])
      setContent('')
      setShowForm(false)
    }
    setLoading(false)
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('after_notes')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (data) setNotes(prev => prev.map(n => n.id === id ? data as AfterNote : n))
    setEditingId(null)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この After Note を削除しますか？')) return
    await supabase.from('after_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const isAuthor = (note: AfterNote) => note.user_id === currentUserId

  return (
    <div className="mt-6">

      {/* タイムライン */}
      {notes.length > 0 && (
        <div className="relative pl-5 space-y-0">
          {/* 縦線 */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />

          {notes.map((note) => (
            <div key={note.id} className="relative pb-6 last:pb-0">
              {/* ドット */}
              <div className="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full bg-white border-2 border-gray-200" />

              <div className="pl-5">
                {/* 経過時間バッジ */}
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 mb-2">
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
                    <div className="flex gap-2">
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
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-serif">
                      {note.content}
                    </p>
                    {isAuthor(note) && (
                      <div className="flex gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          ))}
        </div>
      )}

      {/* 追記ボタン / フォーム */}
      {currentUserId && (
        <div className={notes.length > 0 ? 'relative pl-5' : ''}>
          {notes.length > 0 && (
            <div className="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full bg-white border-2 border-dashed border-gray-300" />
          )}
          <div className={notes.length > 0 ? 'pl-5' : ''}>
            {showForm ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-1">
                  {timeAfterOriginal(postCreatedAt, new Date().toISOString())} ·{' '}
                  {formatDate(new Date().toISOString())}
                </p>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="あれから気づいたこと、変わった見方、ふと思い出したこと..."
                  rows={3}
                  autoFocus
                  className="w-full text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 placeholder-amber-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!content.trim() || loading}
                    className="text-xs text-amber-700 font-medium hover:text-amber-900 disabled:opacity-40"
                  >
                    追記する
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setContent('') }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 py-1"
              >
                <span className="text-base leading-none">+</span>
                <span>After Note を追加</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
