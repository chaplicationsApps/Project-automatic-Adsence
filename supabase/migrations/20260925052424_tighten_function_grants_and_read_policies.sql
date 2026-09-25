-- Restrict direct execution of the pre-existing RLS event-trigger function.
-- Preserve its body, owner, search_path and the ensure_rls event trigger.
-- Local/fresh projects may not contain this platform-created function.
do $migration$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$migration$;

-- FOR ALL also participates in SELECT. Split administration writes into explicit
-- operations so each role has one permissive SELECT policy per table.
-- categories_public_read already permits every category to both public roles.
drop policy categories_admin_write on public.categories;

create policy categories_admin_insert on public.categories for insert to authenticated
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy categories_admin_update on public.categories for update to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy categories_admin_delete on public.categories for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy tool_definitions_admin on public.tool_definitions;
alter policy tool_definitions_public_read on public.tool_definitions to anon;

-- Preserve the old OR semantics for authenticated users. Admins can read drafts;
-- other users can read published definitions only. Anon uses the policy above.
create policy tool_definitions_authenticated_read on public.tool_definitions for select to authenticated
  using (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
    or (status = 'published' and current_version is not null)
  );
create policy tool_definitions_admin_insert on public.tool_definitions for insert to authenticated
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy tool_definitions_admin_update on public.tool_definitions for update to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy tool_definitions_admin_delete on public.tool_definitions for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy tool_versions_admin on public.tool_versions;
alter policy tool_versions_public_read on public.tool_versions to anon;

create policy tool_versions_authenticated_read on public.tool_versions for select to authenticated
  using (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
    or exists (
      select 1 from public.tool_definitions as tool
      where tool.id = tool_versions.tool_id
        and tool.status = 'published'
        and tool.current_version = tool_versions.version
    )
  );
create policy tool_versions_admin_insert on public.tool_versions for insert to authenticated
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy tool_versions_admin_update on public.tool_versions for update to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy tool_versions_admin_delete on public.tool_versions for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
