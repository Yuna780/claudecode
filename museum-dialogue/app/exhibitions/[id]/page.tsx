"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Exhibition, Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import PostCard from "@/components/posts/PostCard";
import PostForm from "@/components/posts/PostForm";

export default function ExhibitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));

    supabase
      .from("exhibitions")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setExhibition(data as Exhibition));

    fetchPosts();
  }, [id]);

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("exhibition_id", id)
      .order("created_at", { ascending: false });

    if (!data) return;

    const postsWithMeta = await Promise.all(
      data.map(async (post) => {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", post.user_id).single();
        const { count: likesCount } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
        const { count: commentsCount } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id);
        let userHasLiked = false;
        if (user) {
          const { data: like } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();
          userHasLiked = !!like;
        }
        return {
          ...post,
          profile,
          likes_count: likesCount ?? 0,
          comments_count: commentsCount ?? 0,
          user_has_liked: userHasLiked,
        } as Post;
      })
    );

    setPosts(postsWithMeta);
  };

  if (!exhibition) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">読み込み中...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100 mb-6">
        {exhibition.image_url ? (
          <Image src={exhibition.image_url} alt={exhibition.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🖼</div>
        )}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{exhibition.title}</h1>
      <p className="text-gray-500 mb-2">{exhibition.description}</p>
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
        <span>📍 {exhibition.location}</span>
        <span>{formatDate(exhibition.start_date)} 〜 {formatDate(exhibition.end_date)}</span>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">感想・対話</h2>

      {currentUserId ? (
        <div className="mb-6">
          <PostForm
            exhibitionId={id}
            onSaved={(post) => setPosts((prev) => [post, ...prev])}
          />
        </div>
      ) : (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 text-center text-sm text-gray-400">
          投稿するには <a href="/login" className="text-gray-700 font-medium hover:underline">ログイン</a> が必要です
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>まだ感想が投稿されていません。最初の一言を！</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              onUpdated={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
            />
          ))
        )}
      </div>
    </div>
  );
}
