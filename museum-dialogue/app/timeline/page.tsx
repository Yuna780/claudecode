"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Post, Exhibition } from "@/lib/types";
import PostCard from "@/components/posts/PostCard";

const PROMPT_LABELS = [
  "一番印象に残った作品は？",
  "それはなぜですか？",
  "他の来場者の意見で、見方が変わりましたか？",
];

export default function TimelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));
    supabase
      .from("exhibitions")
      .select("*")
      .order("start_date", { ascending: false })
      .then(({ data }) => setExhibitions((data as Exhibition[]) ?? []));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (selectedExhibition !== "all") {
      query = query.eq("exhibition_id", selectedExhibition);
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    const postsWithMeta = await Promise.all(
      data.map(async (post) => {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", post.user_id).single();
        const { data: exhibition } = await supabase.from("exhibitions").select("title").eq("id", post.exhibition_id).single();
        const { count: likesCount } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
        const { count: commentsCount } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id);
        let userHasLiked = false;
        if (user) {
          const { data: like } = await supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle();
          userHasLiked = !!like;
        }
        return {
          ...post,
          profile,
          exhibition,
          likes_count: likesCount ?? 0,
          comments_count: commentsCount ?? 0,
          user_has_liked: userHasLiked,
        } as Post & { exhibition: { title: string } };
      })
    );

    setPosts(postsWithMeta as Post[]);
    setLoading(false);
  }, [selectedExhibition]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">タイムライン</h1>
        <p className="text-gray-500 mt-1">みんなの展覧会の感想</p>
      </div>

      {/* 展覧会フィルター */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setSelectedExhibition("all")}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
              selectedExhibition === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            すべて
          </button>
          {exhibitions.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExhibition(ex.id)}
              className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                selectedExhibition === ex.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {/* 投稿一覧 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🖼</p>
          <p className="mb-4">まだ感想が投稿されていません</p>
          <Link href="/exhibitions" className="text-sm text-gray-700 font-medium hover:underline">
            展覧会を見る →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id}>
              {/* 展覧会バッジ */}
              <div className="mb-1 px-1">
                <Link
                  href={`/exhibitions/${post.exhibition_id}`}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  🖼 {(post as Post & { exhibition?: { title: string } }).exhibition?.title}
                </Link>
              </div>
              <PostCard
                post={post}
                currentUserId={currentUserId}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                onUpdated={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
