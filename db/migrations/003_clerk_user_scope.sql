alter table if exists profiles
  add column if not exists clerk_user_id text;

create unique index if not exists profiles_clerk_user_id_idx
  on profiles(clerk_user_id)
  where clerk_user_id is not null;

alter table if exists email_runs
  add column if not exists clerk_user_id text;

create index if not exists email_runs_clerk_user_id_idx
  on email_runs(clerk_user_id);

alter table if exists job_runs
  add column if not exists clerk_user_id text;

create index if not exists job_runs_clerk_user_id_idx
  on job_runs(clerk_user_id);
