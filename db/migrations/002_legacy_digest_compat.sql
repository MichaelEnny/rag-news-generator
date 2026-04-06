alter table if exists digests
  add column if not exists generated_title text;

update digests
set generated_title = title
where generated_title is null
  and title is not null;
