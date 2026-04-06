create table if not exists sources (
  slug text primary key,
  label text not null,
  description text not null default '',
  kind text not null check (kind in ('rss', 'youtube')),
  url text not null,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id text primary key,
  name text not null,
  title text not null,
  background text not null,
  expertise_level text not null,
  interests jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  delivery_email text not null default '',
  digest_window_hours integer not null default 24,
  top_n integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists articles (
  id text primary key,
  source_slug text not null references sources(slug) on delete cascade,
  source_type text not null,
  external_id text not null,
  title text not null,
  url text not null,
  description text not null default '',
  published_at timestamptz not null,
  raw_content text not null default '',
  content_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists articles_url_idx on articles(url);
create index if not exists articles_published_at_idx on articles(published_at desc);

create table if not exists digests (
  id text primary key,
  article_id text not null references articles(id) on delete cascade,
  generated_title text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists email_runs (
  id text primary key,
  subject text not null,
  greeting text not null,
  introduction text not null,
  body_html text not null,
  body_markdown text not null,
  status text not null,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists job_runs (
  id text primary key,
  stage text not null,
  status text not null,
  trigger text not null,
  summary jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

insert into profiles (
  id, name, title, background, expertise_level, interests, preferences, delivery_email, digest_window_hours, top_n
) values (
  'default',
  'Dave',
  'AI Engineer & Researcher',
  'Experienced AI engineer with deep interest in practical AI applications, research breakthroughs, and production-ready systems.',
  'Advanced',
  '["Large Language Models and their applications","Retrieval-Augmented Generation systems","AI agent architectures","Multimodal AI","Production AI systems","Research with practical implications"]'::jsonb,
  '{"preferPractical":true,"preferTechnicalDepth":true,"preferResearchBreakthroughs":true,"preferProductionFocus":true,"avoidMarketingHype":true}'::jsonb,
  '',
  24,
  10
) on conflict (id) do nothing;

insert into sources (slug, label, description, kind, url, is_active) values
  ('openai-news', 'OpenAI News', 'Official OpenAI announcements from the RSS feed.', 'rss', 'https://openai.com/news/rss.xml', true),
  ('anthropic-news', 'Anthropic News', 'Anthropic blog, engineering, and research feed rollup.', 'rss', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', true),
  ('matthew-berman', 'Matthew Berman', 'YouTube creator feed for implementation-focused AI updates.', 'youtube', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCawZsQWqfGSbCI5yjkdVkTA', true)
on conflict (slug) do nothing;
