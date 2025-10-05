---
description: build-technicians
---
name: build_technicians_crud
aliases:
  - technicians_crud
  - technicians
description: Add a full Technicians module (CRUD + hex color) aligned to the project's existing multi-tenant schema (React + Vite + TS + Tailwind + shadcn/ui + Supabase on Vercel). Place this file in `.claude/commands/` and run it as a Claude Command.
model: claude-3.5-sonnet
author: Route Maker Prompts
version: "1.0"
---

# Build “Technicians” CRUD — Align with Existing Multi‑Tenant Schema

You are an expert full‑stack engineer and code generator. **Do not scaffold a new project.** The app already runs on **React + Vite + TypeScript + Tailwind + shadcn/ui** with **Supabase (DB/Auth)** and is deployed on **Vercel**. Add a new feature **Technicians** that fully respects and **aligns with the current multi‑tenant schema** already in the database.

## Objectives

1. Create a top‑level **Technicians** module with full CRUD:
   - **List** (search, filter, sort, paginate)
   - **Create** (Add)
   - **Read** (Detail)
   - **Update** (Edit)
   - **Delete** (with confirmation)
2. Each technician has employment type (**contractor** or **employee**), contact info, cost info, status, notes, and a **hex color** (`#RRGGBB`) that will represent the technician on a future route map.
3. **Critically: adapt to the project’s existing multi‑tenant schema.** Do not invent new tenancy columns if equivalents exist. Detect and use the existing columns, relationships, and RLS conventions.

---

## Multi‑Tenant Alignment (Detect & Conform)

Before generating any SQL or code, **introspect the current schema** and **choose column/relationship names that match the project’s reality**. Follow this playbook:

1. **Discover tenancy primitives**
   - Inspect `information_schema.columns` (or `pg_catalog`) to detect which tenancy columns are used across existing domain tables. Common variants include: `org_id`, `organization_id`, `tenant_id`, `account_id`, `workspace_id`, `company_id`, or `owner_id`.
   - Identify the **canonical tenant key** used in most tables (e.g., `org_id uuid` or `tenant_id uuid`), and the **membership policy** already present (RLS policies or helper functions like `is_org_member(auth.uid(), org_id)` or similar).
   - If the project uses **per‑user ownership** (`owner_id = auth.uid()`), prefer that pattern. If it uses **org‑scoped records**, prefer `org_id` (or the detected canonical key). If both exist, **mirror the dominant pattern**.

2. **Choose the correct foreign sources**
   - If an organizations/tenants table exists (e.g., `public.organizations(id uuid)`), reference that in the technicians table.
   - If the project only uses `owner_id` linked to `auth.users(id)`, reference that instead.
   - **Never introduce a competing tenant key**. Use the one already in use.

3. **Respect RLS style already in the project**
   - If the project has helper functions (e.g., `public.is_org_member(user_id uuid, org_id uuid) returns boolean`), **reuse them**.
   - If the project gates rows with `owner_id = auth.uid()`, copy that pattern.
   - For hybrid installs, create **both** policies (org‑based and owner‑based) and rely on whichever column the migration added.

> Implementation must **branch automatically** at generation time based on what you detect in the live DB. If you cannot detect any canonical tenancy key, default to `owner_id` with per‑user RLS, but keep the code structured so it’s trivial to switch to org‑scoped later by renaming one config object.

---

## Data Model — Conditional Migration Strategy

Create **one** technicians table using the project’s canonical tenancy key. Use **conditional SQL** in separate migration scripts or emit two variants (org‑scoped vs owner‑scoped) and apply the one that matches the schema. Ensure idempotency (`if not exists`) where safe.

### Columns (common)
- `id uuid pk default gen_random_uuid()`
- **Tenancy column** (exact name and FK depend on detection): either
  - `org_id uuid not null references public.organizations(id) on delete cascade`
  - **or** `owner_id uuid not null references auth.users(id) on delete cascade`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`
- `full_name text not null`
- `employment_type text not null check (employment_type in ('contractor','employee'))`
- `email citext unique` *(make unique only if project conventions allow; otherwise just index)*
- `phone text`
- `address_line1 text`
- `address_line2 text`
- `city text`
- `state text`
- `postal_code text`
- `cost_basis text check (cost_basis in ('hourly','salary','per_stop','other')) default 'hourly'`
- `cost_amount numeric(10,2) default 0.00`
- `color_hex text not null default '#22c55e'` *(strictly store as `#RRGGBB`)*
- `active boolean not null default true`
- `notes text`

> If the project uses naming conventions like `updated_at` triggers, email uniqueness, or audited columns (e.g., `created_by`, `updated_by`), adopt them here.

### Indexes
- Index the tenancy column (`org_id` or `owner_id`)
- GIN/TRGM for `full_name` if TRGM is already in use; otherwise btree on `full_name`
- Optional composite indexes following project patterns

### RLS (two canonical variants; emit only what matches)
- **Org‑scoped**: use existing membership fn if present, e.g.:
  - SELECT/INSERT/UPDATE/DELETE policies that check `is_org_member(auth.uid(), org_id)`
- **Owner‑scoped**: policies that check `owner_id = auth.uid()` for SELECT/UPDATE/DELETE; and `WITH CHECK (owner_id = auth.uid())` for INSERT

### Example Migration Snippets (emit the matching one)

**Owner‑scoped (fallback when no orgs detected)**
```sql
create extension if not exists citext;

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  employment_type text not null check (employment_type in ('contractor','employee')),
  email citext,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  cost_basis text check (cost_basis in ('hourly','salary','per_stop','other')) default 'hourly',
  cost_amount numeric(10,2) default 0.00,
  color_hex text not null default '#22c55e',
  active boolean not null default true,
  notes text
);

create index if not exists technicians_owner_idx on public.technicians(owner_id);
create index if not exists technicians_name_idx on public.technicians(full_name);

alter table public.technicians enable row level security;

drop policy if exists technicians_select_own on public.technicians;
create policy technicians_select_own
on public.technicians for select
to authenticated using (owner_id = auth.uid());

drop policy if exists technicians_insert_own on public.technicians;
create policy technicians_insert_own
on public.technicians for insert
to authenticated with check (owner_id = auth.uid());

drop policy if exists technicians_update_own on public.technicians;
create policy technicians_update_own
on public.technicians for update
to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists technicians_delete_own on public.technicians;
create policy technicians_delete_own
on public.technicians for delete
to authenticated using (owner_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists technicians_set_updated_at on public.technicians;
create trigger technicians_set_updated_at
before update on public.technicians
for each row execute procedure public.set_updated_at();
```

**Org‑scoped (preferred if orgs/tenants detected)**
```sql
create extension if not exists citext;

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  employment_type text not null check (employment_type in ('contractor','employee')),
  email citext,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  cost_basis text check (cost_basis in ('hourly','salary','per_stop','other')) default 'hourly',
  cost_amount numeric(10,2) default 0.00,
  color_hex text not null default '#22c55e',
  active boolean not null default true,
  notes text
);

create index if not exists technicians_org_idx on public.technicians(org_id);
create index if not exists technicians_name_idx on public.technicians(full_name);

alter table public.technicians enable row level security;

-- Reuse existing membership helper if present; otherwise provide a minimal default
-- (Only create the function if it does not already exist.)
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_org_member'
  ) then
    create or replace function public.is_org_member(user_id uuid, org_id uuid)
    returns boolean language sql stable as $$
      select exists (
        select 1 from public.organization_members om
        where om.user_id = user_id and om.org_id = org_id
      );
    $$;
  end if;
end $$;

drop policy if exists technicians_select_org on public.technicians;
create policy technicians_select_org
on public.technicians for select
to authenticated using (public.is_org_member(auth.uid(), org_id));

drop policy if exists technicians_insert_org on public.technicians;
create policy technicians_insert_org
on public.technicians for insert
to authenticated with check (public.is_org_member(auth.uid(), org_id));

drop policy if exists technicians_update_org on public.technicians;
create policy technicians_update_org
on public.technicians for update
to authenticated using (public.is_org_member(auth.uid(), org_id)) with check (public.is_org_member(auth.uid(), org_id));

drop policy if exists technicians_delete_org on public.technicians;
create policy technicians_delete_org
on public.technicians for delete
to authenticated using (public.is_org_member(auth.uid(), org_id));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists technicians_set_updated_at on public.technicians;
create trigger technicians_set_updated_at
before update on public.technicians
for each row execute procedure public.set_updated_at();
```

---

## TypeScript Types & Validation

Create a shared zod schema that **only accepts strict hex** (`#` + 6 hex digits). Allow optional fields consistent with project conventions (empty string → undefined when appropriate).

```ts
// src/features/technicians/schema.ts
import { z } from "zod";

export const hexColorRegex = /^#([0-9a-fA-F]{6})$/;

export const TechnicianSchema = z.object({
  id: z.string().uuid().optional(),
  // tenancy key: pick ONE that matches the DB ('org_id' OR 'owner_id'), optional on input
  org_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),

  full_name: z.string().min(2, "Name is required"),
  employment_type: z.enum(["contractor","employee"]),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  cost_basis: z.enum(["hourly","salary","per_stop","other"]).default("hourly"),
  cost_amount: z.coerce.number().min(0).default(0),
  color_hex: z.string().regex(hexColorRegex, "Use #RRGGBB format"),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

export type TechnicianInput = z.infer<typeof TechnicianSchema>;
```

> When creating records, **populate the chosen tenancy key** from session context:
> - Org‑scoped: get `org_id` from the app’s current organization selector/store.
> - Owner‑scoped: set `owner_id = auth.user.id`.

---

## Data Access (Supabase)

Create a repository that **abstracts the tenancy key** via a `TENANCY` config object so only one path is active at runtime.

```ts
// src/features/technicians/tenancy.ts
export type Tenancy = { key: "org_id" | "owner_id"; value: string };
// Implement a resolver using your app’s existing org/user context.
export function resolveTenancy(): Tenancy {
  // Pseudocode: prefer org if present, else owner
  // Replace with the project’s actual store/hooks.
  const orgId = (window as any).__CURRENT_ORG_ID__;
  if (orgId) return { key: "org_id", value: orgId };
  const ownerId = (window as any).__CURRENT_USER_ID__;
  return { key: "owner_id", value: ownerId };
}
```

```ts
// src/features/technicians/api.ts
import { supabase } from "@/lib/supabaseClient";
import { TechnicianSchema, TechnicianInput } from "./schema";
import { resolveTenancy } from "./tenancy";

const table = "technicians";

export async function listTechnicians(opts?: {
  search?: string;
  employmentType?: "contractor" | "employee" | "all";
  active?: boolean | "all";
  page?: number;
  pageSize?: number;
  sort?: { field: string; dir: "asc"|"desc" };
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const { key, value } = resolveTenancy();

  let query = supabase.from(table).select("*", { count: "exact" }).eq(key, value);

  if (opts?.search) query = query.ilike("full_name", `%${opts.search}%`);
  if (opts?.employmentType && opts.employmentType !== "all") query = query.eq("employment_type", opts.employmentType);
  if (opts?.active !== undefined && opts.active !== "all") query = query.eq("active", opts.active);

  if (opts?.sort) {
    query = query.order(opts.sort.field as any, { ascending: opts.sort.dir === "asc" });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count: count ?? 0 };
}

export async function getTechnician(id: string) {
  const { key, value } = resolveTenancy();
  const { data, error } = await supabase.from(table).select("*").eq("id", id).eq(key, value).single();
  if (error) throw error;
  return data;
}

export async function createTechnician(input: TechnicianInput) {
  const { key, value } = resolveTenancy();
  const parsed = TechnicianSchema.parse(input);
  const payload = { ...parsed, [key]: value };
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTechnician(id: string, input: TechnicianInput) {
  const { key, value } = resolveTenancy();
  const parsed = TechnicianSchema.partial().parse(input);
  const { data, error } = await supabase.from(table).update(parsed).eq("id", id).eq(key, value).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTechnician(id: string) {
  const { key, value } = resolveTenancy();
  const { error } = await supabase.from(table).delete().eq("id", id).eq(key, value);
  if (error) throw error;
}
```

---

## UI (shadcn/ui) — Forms, List, Detail

### Form
- Use `react-hook-form` + `@hookform/resolvers/zod` and shadcn `Form` primitives.
- Pair a native `<input type="color">` with a hex `<Input>`; keep them in sync; validate with zod.
- Fields: name, type (contractor/employee), email, phone, address (line1/line2/city/state/zip), cost basis (hourly/salary/per_stop/other), cost amount, color_hex, active, notes.

### List (DataTable)
- Columns: Name, Type, Email, Phone, Cost (basis + amount), Active, Color swatch, Updated, Actions.
- Controls: search, filters (type; active), sort, pagination.
- Row actions: View, Edit, Delete (confirm with `AlertDialog`).

### Detail
- Header with name and badges (type, active), action buttons (Edit/Delete).
- Panels: Contact, Address, Cost, Color (swatch + hex), Notes.

### Routes & Nav
- `/technicians` (List), `/technicians/new` (Create),
- `/technicians/:id` (Detail), `/technicians/:id/edit` (Edit).
- Add “Technicians” to the main navigation.

---

## UX & Validation Rules

- Enforce `color_hex` strictly as `#RRGGBB`. Normalize to uppercase before save.
- Default color to `#22C55E` unless the user chooses something else.
- Cost hints change with basis: hourly → “$/hr”, salary → “$/yr”, per_stop → “$/stop”, other → “amount”.
- Use toasts for success/error; keep optimistic updates conservative.
- Guard routes behind authentication; reuse existing auth hooks.

---

## Tests (Light)

- Zod schema tests for hex validation and required fields.
- Repo tests with mocked Supabase to verify tenancy key injection and filters.

---

## Deliverables

1. **SQL migration(s)**: technicians table + RLS according to detected tenancy model.
2. **TypeScript**: `schema.ts`, `tenancy.ts`, `api.ts`, `TechnicianForm.tsx`, pages for list/detail/new/edit.
3. **Nav registration** and route wiring.
4. **README** at `src/features/technicians/README.md` documenting detection choices and how to switch tenancy if needed.

---

## Acceptance Criteria

- Visiting **/technicians** shows a paginated, filterable, sortable list.
- I can **Create, Read, Update, Delete** technicians with clear validation.
- I can **choose a hex color** via a color input or type it; the value is stored and displayed.
- **All data is scoped** by the project’s active multi‑tenant model (org‑ or owner‑scoped) with enforced RLS.
- Implementation follows the project’s **naming, file structure, and UI conventions** without introducing extraneous dependencies.

**Now implement exactly as specified, adapting to the detected tenancy model.**
