"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function NewExhibitionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    title: "",
    location: "",
    city: "",
    start_date: "",
    end_date: "",
    description: "",
    official_url: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(form.start_date) > new Date(form.end_date)) {
      setError("終了日は開始日より後にしてください");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("ログインが必要です"); setLoading(false); return; }

    const { data, error: insertError } = await supabase
      .from("exhibitions")
      .insert({
        title: form.title,
        location: form.location,
        city: form.city || null,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description || null,
        official_url: form.official_url || null,
        image_url: form.image_url || null,
      })
      .select("id")
      .single();

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    router.push(`/exhibitions/${data.id}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link href="/exhibitions" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← 展覧会一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">展覧会を追加</h1>
        <p className="text-gray-500 text-sm mt-1">訪れた展覧会を登録して、感想をシェアしましょう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* 必須フィールド */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">必須項目</p>

          <Field label="展覧会タイトル" required>
            <input
              value={form.title}
              onChange={set("title")}
              required
              placeholder="例：モネ 睡蓮のとき"
              className={inputClass}
            />
          </Field>

          <Field label="会場名" required>
            <input
              value={form.location}
              onChange={set("location")}
              required
              placeholder="例：国立西洋美術館"
              className={inputClass}
            />
          </Field>

          <Field label="都市" required>
            <input
              value={form.city}
              onChange={set("city")}
              required
              placeholder="例：東京"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="開始日" required>
              <input
                type="date"
                value={form.start_date}
                onChange={set("start_date")}
                required
                className={inputClass}
              />
            </Field>
            <Field label="終了日" required>
              <input
                type="date"
                value={form.end_date}
                onChange={set("end_date")}
                required
                min={form.start_date}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* 任意フィールド */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">任意項目</p>

          <Field label="説明">
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="展覧会の概要や見どころを書いてください..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="公式URL">
            <input
              type="url"
              value={form.official_url}
              onChange={set("official_url")}
              placeholder="https://example.com"
              className={inputClass}
            />
          </Field>

          <Field label="画像URL">
            <input
              type="url"
              value={form.image_url}
              onChange={set("image_url")}
              placeholder="https://example.com/image.jpg"
              className={inputClass}
            />
            {form.image_url && (
              <div className="mt-2 relative h-32 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={form.image_url}
                  alt="プレビュー"
                  className="w-full h-full object-cover"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </Field>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading} className="flex-1">
            展覧会を登録する
          </Button>
          <Link href="/exhibitions">
            <Button type="button" variant="secondary">キャンセル</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
