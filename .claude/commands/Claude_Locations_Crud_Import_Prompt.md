---
description: Create-Locations
---

# Claude Code — Locations CRUD + “Update GPS” + Import (React + Express + Supabase + Vercel + shadcn/ui)

**Role:** You are a senior full-stack engineer. Work iteratively, generating files with paths. Explain briefly, then output final code.

**Goal:** Add a **Locations** module with full CRUD (List, View, Create, Edit, Delete) for **residential** or **commercial** addresses.  
Additionally, include:
- Row and bulk **“Update GPS”** geocoding functionality (forward address → lat/lng).
- **CSV Import** feature to allow batch import of locations.

---

## Tech Stack

- **Frontend:** React 18 (Vite + TS) + shadcn/ui + TanStack Table + Zod + react-hook-form + Sonner.
- **Backend:** Node 20 + Express, deployed on **Vercel** (serverless functions).
- **Database/Auth:** Supabase (Postgres).
- **Geocoding:** Provider abstraction for OpenCage and Google APIs.
- **Import:** CSV upload (frontend) → Express endpoint → Supabase insert.

---

## Features Summary

| Feature | Description |
|----------|--------------|
| CRUD | Create, Read, Update, Delete locations in Supabase |
| GPS Update | “Update GPS” button triggers geocoding API to update lat/lng |
| Bulk Update | Update GPS for multiple selected records |
| CSV Import | Upload a CSV file with address fields to bulk add locations |
| Filtering | By type, activity status, GPS presence |
| Validation | Client-side Zod + server-side checks |

---

## Supabase Schema (SQL)

```sql
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('residential','commercial')),
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  latitude numeric(10,7),
  longitude numeric(10,7),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Environment Variables

Frontend:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEOCODING_PROVIDER=opencage
GEOCODING_API_KEY=your_key_here
```

---

## CSV Import Feature

### Frontend
- Add a “📤 Import CSV” button on the Locations list view.
- Use a file input and parse CSV client-side using `papaparse`.
- Validate fields with Zod before sending.
- POST parsed data to `/api/locations/import`.

### Backend
- Create `api/locations/import.ts`.
- Accepts array of location objects.
- Validates with server-side schema.
- Inserts valid rows into Supabase using service role key.
- Returns import summary (success/fail counts).

### CSV Example Format
```
name,type,address_line1,address_line2,city,state,postal_code,country,notes
Safari Home,residential,123 Safari Ln,,Dallas,TX,75201,US,Test import
Pool Supply HQ,commercial,45 Water Way,,Fort Worth,TX,76107,US,Main location
```

---

## Geocoding API Setup

Supported providers:
- **OpenCage**: [https://opencagedata.com](https://opencagedata.com)
- **Google Geocoding API**: [https://developers.google.com/maps/documentation/geocoding](https://developers.google.com/maps/documentation/geocoding)

Each provider should implement:
```ts
export interface IGeocoder {
  geocode(address: string): Promise<{ lat: number; lng: number } | null>;
}
```

**Files:**
```
api/lib/geocoding/index.ts
api/lib/geocoding/providers/OpenCage.ts
api/lib/geocoding/providers/Google.ts
```

---

## Deliverables

### Backend
- `api/locations/geocode.ts` (single ID)
- `api/locations/geocode-bulk.ts` (bulk IDs)
- `api/locations/import.ts` (CSV import)
- `api/lib/supabaseAdmin.ts`
- `api/lib/geocoding/index.ts` + providers

### Frontend
- `src/features/locations/pages/LocationsPage.tsx`
- `src/features/locations/components/LocationsTable.tsx`
- `src/features/locations/components/LocationForm.tsx`
- `src/features/locations/components/ViewDrawer.tsx`
- `src/features/locations/components/ImportDialog.tsx`
- `src/features/locations/api/locationsClient.ts`
- `src/features/locations/schema.ts`

---

## Acceptance Criteria

- [ ] `/locations` route displays paginated list.
- [ ] Create/Edit/Delete/Import works via Supabase.
- [ ] “Update GPS” updates coordinates using API.
- [ ] Bulk “Update GPS” handles multiple records.
- [ ] “Import CSV” supports drag/drop or select and shows import summary.
- [ ] Env vars are documented and used correctly.
- [ ] Works locally and on Vercel.

---

## Deployment Notes

1. Add env vars in Vercel project settings.
2. Apply SQL schema via Supabase SQL editor.
3. Deploy using `vercel --prod`.
4. Test API routes at `/api/locations/*`.
5. Confirm geocoding with a valid API key.

---

*Generated on 2025-10-05*
