-- MicroTools Factory: initial schema. Apply through a versioned migration.
-- No elevated client key or SECURITY DEFINER function is needed for these policies.

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.tool_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  short_description text not null default '',
  category_slug text not null references public.categories(slug),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  tool_type text not null default 'declarative' check (tool_type in ('declarative', 'custom')),
  schema_version text not null default '1.0',
  current_version integer check (current_version > 0),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  is_indexable boolean not null default false,
  is_monetizable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint published_requires_version check (status <> 'published' or (current_version is not null and published_at is not null)),
  constraint only_published_indexable check (not is_indexable or status = 'published')
);

create table public.tool_versions (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tool_definitions(id) on delete cascade,
  version integer not null check (version > 0),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  content_hash text,
  created_by uuid references auth.users(id) on delete set null,
  change_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (tool_id, version)
);

-- The selected version must belong to this same tool. Deferred for atomic seed/publication.
alter table public.tool_definitions
  add constraint tool_definitions_current_version_fkey
  foreign key (id, current_version) references public.tool_versions(tool_id, version)
  deferrable initially deferred;

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  entity_type text not null default 'tool',
  entity_id uuid,
  status text not null default 'pending' check (status in ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  priority integer not null default 0,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_code text,
  error_message text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  previous_state text,
  next_state text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'human' check (actor_type in ('human', 'system')),
  job_id uuid references public.jobs(id) on delete set null,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index tool_definitions_category_status_idx on public.tool_definitions(category_slug, status);
create index tool_definitions_published_idx on public.tool_definitions(published_at desc) where status = 'published';
create index tool_versions_created_by_idx on public.tool_versions(created_by);
create index jobs_dispatch_idx on public.jobs(status, scheduled_at, priority desc);
create index audit_log_entity_idx on public.audit_log(entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on public.audit_log(actor_id);
create index audit_log_job_idx on public.audit_log(job_id);

alter table public.categories enable row level security;
alter table public.tool_definitions enable row level security;
alter table public.tool_versions enable row level security;
alter table public.system_settings enable row level security;
alter table public.jobs enable row level security;
alter table public.audit_log enable row level security;

-- Explicit grants keep this independent from dashboard Data API defaults.
grant usage on schema public to anon, authenticated;
revoke all on public.categories, public.tool_definitions, public.tool_versions,
  public.system_settings, public.jobs, public.audit_log from anon, authenticated;
grant select on public.categories, public.tool_definitions, public.tool_versions to anon, authenticated;
grant insert, update, delete on public.categories, public.tool_definitions, public.tool_versions to authenticated;
grant select, insert, update, delete on public.system_settings, public.jobs to authenticated;
grant select, insert on public.audit_log to authenticated;

create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin_write on public.categories for all to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

create policy tool_definitions_public_read on public.tool_definitions for select to anon, authenticated
  using (status = 'published' and current_version is not null);
create policy tool_definitions_admin on public.tool_definitions for all to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

-- Reading versions only depends on tool_definitions; its policy doesn't read versions.
-- This avoids recursive RLS while keeping unpublished and historical JSON private.
create policy tool_versions_public_read on public.tool_versions for select to anon, authenticated
  using (exists (
    select 1 from public.tool_definitions as tool
    where tool.id = tool_versions.tool_id
      and tool.status = 'published'
      and tool.current_version = tool_versions.version
  ));
create policy tool_versions_admin on public.tool_versions for all to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

create policy system_settings_admin on public.system_settings for all to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy jobs_admin on public.jobs for all to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy audit_log_admin_read on public.audit_log for select to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
create policy audit_log_admin_append on public.audit_log for insert to authenticated
  with check (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
    and actor_type = 'human'
    and actor_id = (select auth.uid())
  );

comment on column public.tool_definitions.current_version is 'Only this version is visible publicly, and only while status=published.';
comment on table public.system_settings is 'Admin configuration, never a secret store. Automation consumers must enforce these flags.';
comment on table public.audit_log is 'Append-only for authenticated admins. Privileged workers must set truthful actor context. Never store secrets or tool input PII.';

insert into public.system_settings (key, value, description) values
  ('AUTO_FACTORY_ENABLED', 'false', 'Fábrica automática'),
  ('AI_GENERATION_ENABLED', 'false', 'Generación asistida por IA'),
  ('ADS_ENABLED', 'false', 'Publicidad AdSense'),
  ('ANALYTICS_ENABLED', 'false', 'Analítica externa'),
  ('DUPLICHECKER_ENABLED', 'false', 'Comprobación de originalidad'),
  ('VIDEO_AUTOGEN_ENABLED', 'false', 'Generación de vídeo'),
  ('TIKTOK_ENABLED', 'false', 'Integración TikTok'),
  ('AUTO_SOCIAL_PUBLISH_ENABLED', 'false', 'Publicación social automática'),
  ('AUTO_WEB_PUBLISH_ENABLED', 'false', 'Publicación web automática'),
  ('HIGH_RISK_TOOLS_ENABLED', 'false', 'Herramientas de alto riesgo');
