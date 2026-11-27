# Setup

This guide sets up your own copy of the portfolio with a new Supabase project. All SQL below is generic schema and access policy SQL. It contains no existing owner's account ID, credentials, or portfolio content.

## 1. Create your Supabase project and owner account

1. Create a Supabase project.
2. Create your owner account in **Authentication → Users**, then disable public sign-up.
3. Copy that account's Auth user UUID. You will use it in the owner configuration SQL and `OWNER_USER_ID`.
4. Open the Supabase SQL Editor as the database administrator. Run the SQL blocks below in order on a **fresh database**, once each. The blocks include all five migrations; do not also run the migration files on the same database. Existing installations should apply only migrations they have not already applied.

The fixed UUID `00000000-0000-0000-0000-000000000001` is the application's singleton record ID. It is not an Auth user ID; keep it unchanged. Replace only `YOUR-OWNER-AUTH-USER-UUID` with your own Auth user UUID. `Your Name` is a placeholder that you can later change in the dashboard.

### Check SQL Editor permissions

```sql
set role none;
select current_user, session_user,
       has_schema_privilege(current_user, 'public', 'CREATE') as can_create_in_public;
```

The result should show an administrator such as `postgres` with `can_create_in_public = true`. If it does not, use an administrator session. Do not grant schema creation privileges to `anon` or `authenticated`.

## 2. Create the database schema and policies

### 1. Core tables, owner checks, audit logging, and storage buckets

```sql
-- The SQL Editor may run as authenticated even when connected as postgres.
set role none;
create extension if not exists pgcrypto;

create table public.app_config (
  key text primary key,
  value text not null
);
revoke all on public.app_config from anon, authenticated;
alter table public.app_config enable row level security;

create function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() = (select value::uuid from public.app_config where key = 'owner_user_id')
    and coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;

create table public.site_profile (
  id uuid primary key default '00000000-0000-0000-0000-000000000001' check (id = '00000000-0000-0000-0000-000000000001'),
  display_name text not null default 'Your Name',
  headline text not null default '',
  short_bio text not null default '',
  full_bio text not null default '',
  location text not null default '',
  contact_email text not null default '',
  social_links jsonb not null default '[]'::jsonb,
  photo_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('experience', 'projects', 'skills', 'education', 'certifications')),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  author_id uuid default auth.uid()
);
create unique index projects_slug_unique on public.content_items ((data->>'slug')) where kind = 'projects' and deleted_at is null;
create index content_public_order on public.content_items (kind, sort_order) where status = 'published' and deleted_at is null;

create function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger touch_profile before update on public.site_profile for each row execute function public.touch_updated_at();
create trigger touch_content before update on public.content_items for each row execute function public.touch_updated_at();

alter table public.site_profile enable row level security;
alter table public.content_items enable row level security;
create policy profile_public_read on public.site_profile for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy profile_owner_read on public.site_profile for select to authenticated using (public.is_owner());
create policy profile_owner_insert on public.site_profile for insert to authenticated with check (public.is_owner());
create policy profile_owner_update on public.site_profile for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy content_public_read on public.content_items for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy content_owner_read on public.content_items for select to authenticated using (public.is_owner());
create policy content_owner_insert on public.content_items for insert to authenticated with check (public.is_owner());
create policy content_owner_update on public.content_items for update to authenticated using (public.is_owner()) with check (public.is_owner());

grant select on public.site_profile, public.content_items to anon;
grant select, insert, update on public.site_profile, public.content_items to authenticated;

create function public.reorder_content(ordered_ids uuid[]) returns void language plpgsql security invoker set search_path = public as $$
declare expected_count integer;
begin
  if not public.is_owner() then raise exception 'Forbidden'; end if;
  select count(*) into expected_count from public.content_items
    where id = any(ordered_ids) and deleted_at is null;
  if expected_count <> array_length(ordered_ids, 1) or
     (select count(distinct kind) from public.content_items where id = any(ordered_ids)) <> 1 or
     (select count(distinct entry.id) from unnest(ordered_ids) as entry(id)) <> expected_count then
    raise exception 'Invalid content order';
  end if;
  update public.content_items as item set sort_order = order_list.position
  from unnest(ordered_ids) with ordinality as order_list(id, position)
  where item.id = order_list.id;
end $$;
grant execute on function public.reorder_content(uuid[]) to authenticated;

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
create policy audit_owner_read on public.audit_events for select to authenticated using (public.is_owner());
grant select on public.audit_events to authenticated;
create function public.audit_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_events(actor_id, action, entity_type, entity_id)
  values (auth.uid(), TG_OP, TG_TABLE_NAME, coalesce(new.id, old.id));
  return coalesce(new, old);
end $$;
create trigger audit_profile after insert or update or delete on public.site_profile for each row execute function public.audit_change();
create trigger audit_content after insert or update or delete on public.content_items for each row execute function public.audit_change();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile', 'profile', true, 5000000, array['image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-media', 'project-media', false, 5000000, array['image/webp'])
on conflict (id) do nothing;
```

### Configure your owner account

Replace the placeholder with your Auth user UUID before running this block:

```sql
set role none;
insert into public.app_config (key, value)
values ('owner_user_id', 'YOUR-OWNER-AUTH-USER-UUID')
on conflict (key) do update set value = excluded.value;
```

### 2. Private owner details and public display name

```sql
set role none;

create table public.owner_details (
  id uuid primary key default '00000000-0000-0000-0000-000000000001' check (id = '00000000-0000-0000-0000-000000000001'),
  first_name text not null default 'Your Name',
  last_name text not null default '',
  address text not null default '',
  updated_at timestamptz not null default now()
);

create table public.site_identity (
  id uuid primary key default '00000000-0000-0000-0000-000000000001' check (id = '00000000-0000-0000-0000-000000000001'),
  display_name text not null default 'Your Name'
);
alter table public.site_identity enable row level security;
revoke all on public.site_identity from public, anon, authenticated;
grant select on public.site_identity to anon, authenticated;
create policy site_identity_public_read on public.site_identity for select to anon, authenticated using (true);
insert into public.site_identity (display_name)
select coalesce((select display_name from public.site_profile where id = '00000000-0000-0000-0000-000000000001'), 'Your Name');

alter table public.owner_details enable row level security;
revoke all on public.owner_details from public, anon, authenticated;
grant select, insert, update on public.owner_details to authenticated;
create policy owner_details_read on public.owner_details for select to authenticated using (public.is_owner());
create policy owner_details_insert on public.owner_details for insert to authenticated with check (public.is_owner());
create policy owner_details_update on public.owner_details for update to authenticated using (public.is_owner()) with check (public.is_owner());
create trigger touch_owner_details before update on public.owner_details for each row execute function public.touch_updated_at();
create trigger audit_owner_details after insert or update on public.owner_details for each row execute function public.audit_change();

insert into public.owner_details (first_name, last_name)
select split_part(btrim(display_name), ' ', 1),
       btrim(substr(btrim(display_name), length(split_part(btrim(display_name), ' ', 1)) + 1))
from public.site_profile
where id = '00000000-0000-0000-0000-000000000001';

create function public.sync_owner_display_name() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.site_profile (id, display_name)
  values ('00000000-0000-0000-0000-000000000001', btrim(new.first_name || ' ' || new.last_name))
  on conflict (id) do update set display_name = excluded.display_name;
  insert into public.site_identity (id, display_name)
  values ('00000000-0000-0000-0000-000000000001', btrim(new.first_name || ' ' || new.last_name))
  on conflict (id) do update set display_name = excluded.display_name;
  return new;
end $$;
create trigger sync_owner_display_name after insert or update of first_name, last_name on public.owner_details
for each row execute function public.sync_owner_display_name();

do $$ begin
  if has_table_privilege('anon', 'public.owner_details', 'SELECT') then
    raise exception 'owner_details must not be readable by anonymous users';
  end if;
end $$;
```

### 3. Private CV contact and reference fields

```sql
set role none;

alter table public.owner_details
  add column phone text not null default '',
  add column email text not null default '',
  add column linkedin_url text not null default '',
  add column portfolio_url text not null default '',
  add column reference_text text not null default '';
```

### 4. Public access to images of published projects

```sql
create policy project_media_read on storage.objects for select to anon, authenticated
using (
  bucket_id = 'project-media' and (
    public.is_owner() or exists (
      select 1 from public.content_items item
      where item.kind = 'projects' and item.status = 'published' and item.deleted_at is null
        and (item.data->>'cover_path' = name or name = any(string_to_array(coalesce(item.data->>'gallery_paths', ''), chr(10))))
    )
  )
);
```

### 5. Project image uploads for the MFA-verified owner

```sql
create policy project_media_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'project-media' and public.is_owner());
```

## 3. Configure the local environment

Copy `.env.example` to `.env.local` and fill in your own values:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY
OWNER_USER_ID=YOUR-OWNER-AUTH-USER-UUID
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-ONLY-SERVICE-ROLE-KEY
```

The service role key is currently required by the profile photo upload/removal route. Project image uploads use the authenticated owner client and the storage policy above. Keep `.env.local` out of Git, and never prefix the service role key with `NEXT_PUBLIC_`.

Use the project URL and publishable key from your Supabase project's API settings. Copy the service role key from the project's API keys settings. `OWNER_USER_ID` must match the Auth user UUID configured in `public.app_config`, not the singleton record ID. Set `NEXT_PUBLIC_SITE_URL` to your site's origin without a trailing slash. Restart the development server after changing environment variables.

In Supabase Authentication settings, configure your local site URL and allowed redirect URLs. Keep email confirmation and rate limits enabled.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/admin/login`, sign in as your owner account, and enroll or verify TOTP multi-factor authentication. The owner policies require a verified MFA session (`aal2`). Save your own name in the dashboard's owner details first, then enter your profile and portfolio content and publish the entries you want visitors to see.

For a phone on the same Wi-Fi, run `npm run dev -- --hostname 0.0.0.0` and visit `http://YOUR-COMPUTER-IP:3000`.

## 4. Verify access and features

The `profile` bucket is public and stores processed profile photos. The `project-media` bucket is private; its read policy allows the MFA-verified owner to read images and visitors to read only images referenced by published, non-deleted projects. `owner_details` stores private CV contact information.

Check the private table permission in the SQL Editor:

```sql
select has_table_privilege('anon', 'public.owner_details', 'SELECT')
       as anonymous_can_read_owner_details;
```

The result must be `false`.

In a signed-out browser, check that published projects and their images load, draft project images do not load, and `/admin` redirects to login. Anonymous users must not be able to upload images or generate CVs. In the owner session, test saving content, uploading a cover and several screenshots, updating a profile photo, and downloading a CV. Confirm that PDF text is selectable and dates and page breaks display correctly.

```bash
npm run check
npm test
npm run build
```

## 5. Deploy

Deploy the repository as a Next.js project, for example on Vercel. Configure the same environment variables on the hosting platform, using your production URL for `NEXT_PUBLIC_SITE_URL`. Add the production URL to Supabase Auth's allowed redirects, then verify login, MFA, publishing, project images, profile photos, and CV downloads on the deployed site.

## 6. Backups

Back up the database and both storage buckets (`profile` and `project-media`). Test restoration in a separate Supabase project before relying on the backups.
