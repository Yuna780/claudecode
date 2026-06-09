"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Post, Exhibition } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";

type DiaryPost = Post & { exhibition: Exhibition };

type Stats = {
  totalExhibitions: number;
  totalPosts: number;
  totalLikesReceived: number;
  totalComments: number;
};

export default function DiaryPage() {
  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [stats, setStats] = useState<Stats>({ totalExhibitions: 0, totalPosts: 0, totalLikesReceived: 0, totalComments: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      // ユーザーの投稿をすべて取得
      const { data: rawPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!rawPosts) { setLoading(false); return; }

      // 各投稿に展覧会・いいね・コメント数を付加
      const enriched = await Promise.all(
        rawPosts.map(async (post) => {
          const { data: exhibition } = await supabase
            .from("exhibitions").select("*").eq("id", post.exhibition_id).single();
          const { count: likesCount } = await supabase
            .from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
          const { count: commentsCount } = await supabase
            .from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id);
          return {
            ...post,
            exhibition,
            likes_count: likesCount ?? 0,
            comments_count: commentsCount ?? 0,
          } as DiaryPost;
        })
      );

      setPosts(enriched);

      // 統計
      const uniqueExhibitions = new Set(enriched.map(p => p.exhibition_id)).size;
      const totalLikes = enriched.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
      const totalComments = enriched.reduce((sum, p) => sum + (p.comments_count ?? 0), 0);
      setStats({
        totalExhibitions: uniqueExhibitions,
        totalPosts: enriched.length,
        totalLikesReceived: totalLikes,
        totalComments,
      });

      setLoading(false);
    });
  }, []);

  // 検索フィルター
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(p =>
      p.content?.toLowerCase().includes(q) ||
      p.prompt1?.toLowerCase().includes(q) ||
      p.prompt2?.toLowerCase().includes(q) ||
      p.prompt3?.toLowerCase().includes(q) ||
      p.exhibition?.title?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  // 訪問した展覧会一覧（重複なし）
  const visitedExhibitions = useMemo(() => {
    const seen = new Set<string>();
    return posts
      .filter(p => { if (seen.has(p.exhibition_id)) return false; seen.add(p.exhibition_id); return true; })
      .map(p => p.exhibition)
      .filter(Boolean);
  }, [posts]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* タイトル */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">私の美術館日記</h1>
        <p className="text-gray-500 mt-1">訪れた展覧会と感想の記録</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "訪問展覧会", value: stats.totalExhibitions, icon: "🖼" },
          { label: "投稿数", value: stats.totalPosts, icon: "✏️" },
          { label: "もらったいいね", value: stats.totalLikesReceived, icon: "♥" },
          { label: "コメント数", value: stats.totalComments, icon: "💬" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 訪問した展覧会 */}
      {visitedExhibitions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">訪れた展覧会</h2>
          <div className="flex flex-wrap gap-2">
            {visitedExhibitions.map((ex) => (
              <Link
                key={ex.id}
                href={`/exhibitions/${ex.id}`}
                className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-gray-400 transition-colors"
              >
                {ex.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 感想一覧 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">すべての感想</h2>
          <span className="text-sm text-gray-400">{filteredPosts.length} 件</span>
        </div>

        {/* 検索 */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="感想を検索..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? (
              <p>「{search}」に一致する感想はありません</p>
            ) : (
              <>
                <p className="text-5xl mb-4">📔</p>
                <p className="mb-4">まだ感想がありません</p>
                <Link href="/exhibitions" className="text-sm text-gray-700 font-medium hover:underline">
                  展覧会を見る →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/exhibitions/${post.exhibition_id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                {/* 展覧会名・日付 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    🖼 {post.exhibition?.title}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                </div>

                {/* プロンプト回答 */}
                {[post.prompt1, post.prompt2, post.prompt3].some(Boolean) && (
                  <div className="space-y-2 mb-3">
                    {[
                      { label: "一番印象に残った作品は？", value: post.prompt1 },
                      { label: "それはなぜですか？", value: post.prompt2 },
                      { label: "他の来場者の意見で、見方が変わりましたか？", value: post.prompt3 },
                    ].filter(p => p.value).map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400 mb-0.5">Q. {p.label}</p>
                        <p className="text-sm text-gray-700">{p.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 自由感想 */}
                {post.content && (
                  <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                )}

                {/* いいね・コメント */}
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>♥ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                  <span className="ml-auto">{timeAgo(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
