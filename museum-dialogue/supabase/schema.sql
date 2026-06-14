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

-- real exhibitions seed (remove fictional data before running)
insert into exhibitions (title, description, official_url, start_date, end_date, location, city) values
(
  'モネ 睡蓮のとき',
  'クロード・モネが晩年に取り組んだ「睡蓮」連作を中心に、国立西洋美術館の所蔵作品と海外からの借用作品で構成。モネの眼と光の探求に迫る大規模回顧展。',
  'https://www.nmwa.go.jp/jp/exhibitions/2024monet.html',
  '2024-10-05', '2025-02-11', '国立西洋美術館', '東京'
),
(
  'デ・キリコ展',
  '形而上絵画の創始者ジョルジョ・デ・キリコの全貌を紹介する日本初の大規模回顧展。初期から晩年まで約140点を展示。',
  'https://dechirico.exhibit.jp',
  '2024-04-27', '2024-08-29', '東京都美術館', '東京'
),
(
  'マティス展',
  'アンリ・マティスの画業を回顧する大規模展覧会。油彩、素描、版画、彫刻、切り紙絵など多彩な作品約150点を展示。',
  'https://matisse2023.jp',
  '2023-04-27', '2023-08-20', '東京都現代美術館', '東京'
),
(
  'ルーヴル美術館展 愛を描く',
  'ルーヴル美術館が所蔵する絵画作品の中から「愛」をテーマに73点を厳選。西洋絵画における愛の表現の変遷をたどる。',
  'https://louvre2023.jp',
  '2023-03-01', '2023-05-22', '国立新美術館', '東京'
);
