export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type Exhibition = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  start_date: string
  end_date: string
  location: string
  city: string | null
  official_url: string | null
  created_at: string
}

export type Post = {
  id: string
  exhibition_id: string
  user_id: string
  content: string
  prompt1: string | null
  prompt2: string | null
  prompt3: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  likes_count?: number
  comments_count?: number
  user_has_liked?: boolean
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type AfterNote = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}
