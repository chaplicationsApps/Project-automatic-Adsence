-- Run only against a disposable/local Supabase DB after migrations.
-- psql -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql "$LOCAL_DATABASE_URL"
-- No actual users are created. All fixtures and writes are rolled back.
begin;

insert into public.categories(slug, name) values ('rls-test', 'RLS fixture');
insert into public.tool_definitions(id, slug, title, category_slug, status, current_version, published_at) values
  ('11111111-1111-4111-8111-111111111111', 'rls-published', 'Published', 'rls-test', 'published', 1, now()),
  ('22222222-2222-4222-8222-222222222222', 'rls-draft', 'Draft', 'rls-test', 'draft', null, null);
insert into public.tool_versions(tool_id, version, definition) values
  ('11111111-1111-4111-8111-111111111111', 1, '{"fixture":"current"}'),
  ('11111111-1111-4111-8111-111111111111', 2, '{"fixture":"private-next-version"}'),
  ('22222222-2222-4222-8222-222222222222', 1, '{"fixture":"draft"}');
insert into public.jobs(id, job_type, idempotency_key) values
  ('44444444-4444-4444-8444-444444444444', 'rls-test', 'rls-fixture-job');
insert into public.audit_log(entity_type, action, actor_type, job_id) values
  ('test', 'rls-fixture', 'system', '44444444-4444-4444-8444-444444444444');
set constraints all immediate;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  if (select count(*) from public.tool_definitions where category_slug = 'rls-test') <> 1 then
    raise exception 'RLS: anon must only see published tools';
  end if;
  if (select count(*) from public.tool_versions where tool_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')) <> 1 then
    raise exception 'RLS: anon must only see the selected public version';
  end if;
  begin
    insert into public.categories(slug, name) values ('rls-unauthorized', 'Unauthorized');
    raise exception 'RLS: anon write unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.system_settings;
    raise exception 'RLS: anon read of settings unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
-- A user-controlled role claim must not grant administration.
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"33333333-3333-4333-8333-333333333333","app_metadata":{},"user_metadata":{"role":"admin"}}', true);
do $$
begin
  if (select count(*) from public.tool_definitions where category_slug = 'rls-test') <> 1 then
    raise exception 'RLS: a regular user saw draft tools';
  end if;
  if (select count(*) from public.tool_versions where tool_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')) <> 1 then
    raise exception 'RLS: a regular user saw private versions';
  end if;
  if exists (select 1 from public.system_settings) or exists (select 1 from public.jobs) or exists (select 1 from public.audit_log) then
    raise exception 'RLS: user_metadata granted access to internal tables';
  end if;
  begin
    insert into public.system_settings(key, value) values ('RLS_UNAUTHORIZED', 'true');
    raise exception 'RLS: a regular user changed settings';
  exception when insufficient_privilege then null;
  end;
  update public.tool_definitions set title = 'Unauthorized' where slug = 'rls-published';
  if found then raise exception 'RLS: a regular user updated a tool'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"33333333-3333-4333-8333-333333333333","app_metadata":{"role":"admin"}}', true);
do $$
begin
  if (select count(*) from public.tool_definitions where category_slug = 'rls-test') <> 2 then
    raise exception 'RLS: admin cannot see all tools';
  end if;
  if (select count(*) from public.tool_versions where tool_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')) <> 3 then
    raise exception 'RLS: admin cannot see all versions';
  end if;
  update public.tool_definitions set title = 'Admin changed' where slug = 'rls-draft';
  if not found then raise exception 'RLS: admin update was blocked'; end if;
  insert into public.system_settings(key, value) values ('RLS_ADMIN_TEST', 'false');
  begin
    delete from public.audit_log;
    raise exception 'RLS: audit log deletion unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
rollback;
