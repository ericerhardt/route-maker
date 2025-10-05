# Locations Multi-Tenant Update

## Overview

The Locations module has been updated to support **proper multi-tenant organization filtering**. Users can now only see and manage locations within their own organization(s).

## What Changed?

### ✅ Database Schema

1. **Added `organization_id` column** to the `locations` table
2. **Created organization-scoped RLS policies** that ensure users can only access locations within organizations they are members of
3. **Migration file created**: `supabase/migrations/20251005_add_organization_to_locations.sql`

### ✅ Backend API (Express)

**All endpoints now require organization context:**

| Endpoint | Change |
|----------|--------|
| `GET /api/locations/organization/:organizationId` | New: List locations for specific organization |
| `POST /api/locations` | Now requires `organization_id` in payload |
| `PUT /api/locations/:id` | Verifies user has access to location's organization |
| `DELETE /api/locations/:id` | Verifies user has access to location's organization |
| `POST /api/locations/:id/geocode` | Verifies user has access to location's organization |
| `POST /api/locations/geocode-bulk` | Verifies user has access to all locations' organizations |
| `POST /api/locations/import` | Now requires `organizationId` parameter |

**Security improvements:**
- All routes use `requireAuth` middleware
- Added `verifyOrgMembership()` helper function
- Organization access is verified before any CRUD operation
- Users cannot change `organization_id` during updates

### ✅ Frontend (React)

**LocationsPage now uses organization context:**
- Imports `useOrganization()` hook
- Loads locations only for current organization
- Passes `organizationId` to all API calls
- Automatically refreshes when user switches organizations

**API Client updates:**
- `locationsApi.list(organizationId)` - requires org ID
- `locationsApi.create(organizationId, data)` - requires org ID
- `locationsApi.import(organizationId, locations)` - requires org ID

**Schema updates:**
- `organization_id` added to `Location` type
- `organization_id` excluded from `LocationFormData` (auto-filled by API)

## Migration Steps

### 1. Apply Database Migration

```bash
# Via Supabase CLI
supabase db push

# Or via SQL Editor in Supabase Dashboard
# Run: supabase/migrations/20251005_add_organization_to_locations.sql
```

### 2. Handle Existing Data

If you have existing locations without `organization_id`, you need to either:

**Option A: Assign to default organization**
```sql
-- Replace 'your-org-id' with actual organization ID
UPDATE public.locations
SET organization_id = 'your-org-id'
WHERE organization_id IS NULL;
```

**Option B: Delete test data**
```sql
DELETE FROM public.locations WHERE organization_id IS NULL;
```

### 3. Update Environment Variables

No changes needed - existing variables work as-is.

### 4. Restart Services

```bash
# Restart backend
npm run server

# Restart frontend (if running)
npm run dev
```

## Security Model

### Row Level Security (RLS)

The locations table uses RLS policies that enforce organization boundaries:

```sql
-- Users can only SELECT locations in their organizations
CREATE POLICY "Users can select locations in their organizations"
  ON public.locations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );
```

Similar policies exist for INSERT, UPDATE, and DELETE operations.

### Backend Verification

Even with RLS enabled, the backend performs additional checks:

```typescript
async function verifyOrgMembership(userId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  return !!data
}
```

This provides **defense in depth** - both database and application layers enforce access control.

## Testing

### Test Organization Isolation

1. **Create locations in Organization A**
   - Sign in as user in Org A
   - Create several locations
   - Note the organization ID in the dropdown

2. **Switch to Organization B**
   - Use organization selector in navbar
   - Verify locations list is empty or shows different locations
   - Create locations in Org B

3. **Verify no cross-organization access**
   - Locations from Org A should not appear when Org B is selected
   - Cannot edit/delete locations from other organizations

### Test CSV Import

1. Import locations using the CSV dialog
2. Verify all imported locations have correct `organization_id`
3. Check they only appear when that organization is selected

### Test GPS Geocoding

1. Select multiple locations from current organization
2. Click "Update GPS (X)" button
3. Verify geocoding only processes selected organization's locations

## API Changes Summary

### Before (Non-Multi-Tenant)
```typescript
// Frontend
const locations = await locationsApi.list()
await locationsApi.create(formData)
await locationsApi.import(csvLocations)

// Backend
GET /api/locations
POST /api/locations
POST /api/locations/import
```

### After (Multi-Tenant)
```typescript
// Frontend
const locations = await locationsApi.list(currentOrganization.id)
await locationsApi.create(currentOrganization.id, formData)
await locationsApi.import(currentOrganization.id, csvLocations)

// Backend
GET /api/locations/organization/:organizationId
POST /api/locations  // body includes organization_id
POST /api/locations/import  // body includes organizationId
```

## Troubleshooting

### "Not a member of this organization"

**Cause:** User is not in the `organization_members` table for the requested organization.

**Fix:**
```sql
-- Verify membership
SELECT * FROM public.organization_members
WHERE user_id = 'your-user-id' AND organization_id = 'your-org-id';

-- Add membership if missing
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES ('your-org-id', 'your-user-id', 'member');
```

### "Failed to load locations"

**Cause:** Either no organization selected or database migration not applied.

**Fix:**
1. Check that current organization is set in the UI dropdown
2. Verify migration was applied: `SELECT column_name FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'organization_id';`

### Locations not filtering by organization

**Cause:** RLS policies may not be applied correctly.

**Fix:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'locations';

-- Re-apply policies
\i supabase/migrations/20251005_add_organization_to_locations.sql
```

## Files Modified

### Backend
- [server/src/routes/locations.ts](server/src/routes/locations.ts) - Organization-scoped endpoints
- [server/src/middleware/auth.ts](server/src/middleware/auth.ts) - Already had `requireAuth` and `AuthRequest`

### Frontend
- [src/features/locations/schema.ts](src/features/locations/schema.ts) - Added `organization_id` field
- [src/features/locations/api/locationsClient.ts](src/features/locations/api/locationsClient.ts) - Updated API methods
- [src/features/locations/pages/LocationsPage.tsx](src/features/locations/pages/LocationsPage.tsx) - Organization context integration

### Database
- [supabase/migrations/20251005_add_organization_to_locations.sql](supabase/migrations/20251005_add_organization_to_locations.sql) - Schema changes and RLS policies

## Next Steps

- [ ] Apply database migration
- [ ] Handle existing data (assign to organization or delete)
- [ ] Test organization isolation
- [ ] Update any custom scripts that create locations
- [ ] Deploy to production

## Benefits

✅ **Security**: Users can only access their organization's data
✅ **Data Isolation**: Complete separation between organizations
✅ **Scalability**: Proper multi-tenant architecture
✅ **Compliance**: Meets data privacy requirements
✅ **Defense in Depth**: Both RLS and application-level checks

---

**Last Updated:** 2025-10-05
**Version:** 2.0.0 (Multi-Tenant)
