alter table if exists digests
  add column if not exists generated_title text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'digests'
      and column_name = 'title'
  ) then
    execute '
      update digests
      set generated_title = title
      where generated_title is null
        and title is not null
    ';
  end if;
end $$;
