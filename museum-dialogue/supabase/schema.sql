-- profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- exhibitions
create table exhibitions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  image_url text,
  start_date date not null,
  end_date date not null,
  location text not null,
  created_at timestamptz default now()
);
alter table exhibitions enable row level security;
create policy "Exhibitions are viewable by everyone" on exhibitions for select using (true);

-- posts
create table posts (
  id uuid default gen_random_uuid() primary key,
  exhibition_id uuid references exhibitions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table posts enable row level security;
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Authenticated users can create posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete their own posts" on posts for delete using (auth.uid() = user_id);

-- comments
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);
alter table comments enable row level security;
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can create comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = user_id);

-- likes
create table likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);
alter table likes enable row level security;
create policy "Likes are viewable by everyone" on likes for select using (true);
create policy "Authenticated users can like" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on likes for delete using (auth.uid() = user_id);

-- trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- sample exhibitions
insert into exhibitions (title, description, image_url, start_date, end_date, location) values
('印象派の光と影', 'モネ、ルノワール、ドガなど印象派の巨匠たちが描いた光と影の世界をご覧ください。', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', '2024-01-15', '2024-04-30', '東京都美術館'),
('現代アートの境界線', '国内外の現代アーティストが挑む、アートの新たな可能性。', 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800', '2024-02-01', '2024-05-31', '森美術館'),
('縄文から弥生へ', '日本の夜明け、縄文文化から弥生文化への移り変わりを貴重な出土品とともに辿る。', 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800', '2024-03-10', '2024-06-30', '国立博物館'),
('写真が語る昭和', '昭和の日常を切り取った写真の数々。懐かしくも新鮮な時代の記録。', 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800', '2024-04-01', '2024-07-15', '写真美術館');
