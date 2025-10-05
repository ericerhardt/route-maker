# Locations Module Setup Guide

This guide will help you configure and deploy the Locations CRUD module with GPS geocoding and CSV import functionality.

## Features Implemented

✅ **Full CRUD Operations**
- Create, Read, Update, Delete locations
- Residential and Commercial location types
- Active/Inactive status management

✅ **GPS Geocoding**
- Single location GPS update
- Bulk GPS update for multiple selected locations
- Provider abstraction (OpenCage & Google Maps)

✅ **CSV Import**
- Batch import locations from CSV files
- Client-side validation with Zod
- Server-side validation and error reporting
- Import summary with success/failure counts

✅ **Advanced Table Features**
- Sortable columns
- Global search/filtering
- Pagination
- Row selection for bulk operations
- Responsive design with shadcn/ui

## Prerequisites

1. Node.js 18+ installed
2. Supabase project created
3. Geocoding API key (OpenCage or Google Maps)

## Step 1: Database Setup

### Apply the SQL Migration

1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the migration file located at:
   ```
   supabase/migrations/20251005_create_locations_table.sql
   ```

Alternatively, run it via CLI:
```bash
supabase db push
```

### Verify Table Creation

Check that the `locations` table exists with proper RLS policies:

```sql
-- Test query (should work when authenticated)
SELECT * FROM public.locations;
```

## Step 2: Environment Configuration

### Get Your Supabase Service Role Key

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (⚠️ Keep this secret!)
3. Update your `.env` file:

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Geocoding
GEOCODING_PROVIDER=opencage
GEOCODING_API_KEY=your-api-key-here
```

### Get a Geocoding API Key

#### Option 1: OpenCage (Recommended for Development)

1. Sign up at [https://opencagedata.com](https://opencagedata.com)
2. Free tier: 2,500 requests/day
3. Copy your API key
4. Set in `.env`:
   ```env
   GEOCODING_PROVIDER=opencage
   GEOCODING_API_KEY=your_opencage_key
   ```

#### Option 2: Google Maps Geocoding API

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Geocoding API**
3. Create credentials (API key)
4. Set in `.env`:
   ```env
   GEOCODING_PROVIDER=google
   GEOCODING_API_KEY=your_google_key
   ```

## Step 3: Install Dependencies

Dependencies have already been installed:
- `@tanstack/react-table` - Table component
- `papaparse` - CSV parsing
- `@types/papaparse` - TypeScript types

## Step 4: Run the Application

### Start the Backend Server

```bash
npm run server
```

Server will run on `http://localhost:3001`

### Start the Frontend Dev Server

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Or Run Both Simultaneously

```bash
npm run dev:all
```

## Step 5: Test the Features

### Access the Locations Page

1. Sign in to your application
2. Navigate to **Locations** in the navbar
3. You should see the locations table (empty initially)

### Test CRUD Operations

1. **Create Location**
   - Click "New Location"
   - Fill in the form
   - Click "Create"

2. **View Location**
   - Click the ⋮ menu on any row
   - Select "View"
   - View details in the drawer

3. **Edit Location**
   - Click the ⋮ menu
   - Select "Edit"
   - Update fields and save

4. **Delete Location**
   - Click the ⋮ menu
   - Select "Delete"
   - Confirm deletion

### Test GPS Geocoding

#### Single Location Update

1. Create a location with a valid address
2. Click ⋮ → "Update GPS"
3. Verify coordinates appear in the GPS column

#### Bulk GPS Update

1. Select multiple locations (checkboxes)
2. Click "Update GPS (X)" button
3. Wait for geocoding to complete
4. Check results toast notification

### Test CSV Import

1. Click "Import CSV" button
2. Download the sample CSV format from the dialog
3. Create a CSV file with locations:

```csv
name,type,address_line1,address_line2,city,state,postal_code,country,notes
Safari Home,residential,123 Safari Ln,,Dallas,TX,75201,US,Test import
Pool Supply HQ,commercial,45 Water Way,,Fort Worth,TX,76107,US,Main location
```

4. Upload the CSV file
5. Review validation results
6. Click "Import X Location(s)"
7. Check import summary

## File Structure

```
route-maker/
├── server/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabaseAdmin.ts          # Supabase admin client
│   │   │   └── geocoding/
│   │   │       ├── index.ts              # Geocoding interface
│   │   │       └── providers/
│   │   │           ├── OpenCage.ts       # OpenCage provider
│   │   │           └── Google.ts         # Google provider
│   │   └── routes/
│   │       └── locations.ts              # API endpoints
│   └── ...
├── src/
│   ├── features/
│   │   └── locations/
│   │       ├── api/
│   │       │   └── locationsClient.ts    # API client
│   │       ├── components/
│   │       │   ├── LocationsTable.tsx    # Main table
│   │       │   ├── LocationForm.tsx      # Create/Edit form
│   │       │   ├── ViewDrawer.tsx        # View details
│   │       │   └── ImportDialog.tsx      # CSV import
│   │       ├── pages/
│   │       │   └── LocationsPage.tsx     # Main page
│   │       └── schema.ts                 # Zod schemas
│   └── ...
└── supabase/
    └── migrations/
        └── 20251005_create_locations_table.sql
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations |
| GET | `/api/locations/:id` | Get single location |
| POST | `/api/locations` | Create location |
| PUT | `/api/locations/:id` | Update location |
| DELETE | `/api/locations/:id` | Delete location |
| POST | `/api/locations/:id/geocode` | Update GPS for one |
| POST | `/api/locations/geocode-bulk` | Update GPS for many |
| POST | `/api/locations/import` | Import from CSV |

## Deployment to Vercel

### Add Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=https://your-app.vercel.app
VITE_API_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEOCODING_PROVIDER=opencage
GEOCODING_API_KEY=your-api-key
```

3. Apply to **Production**, **Preview**, and **Development**

### Deploy

```bash
vercel --prod
```

## Troubleshooting

### "Failed to load locations"

- Check that the SQL migration has been applied
- Verify RLS policies allow authenticated users
- Check browser console for detailed errors

### "Could not geocode address"

- Verify your geocoding API key is valid
- Check API quota (free tiers have limits)
- Ensure address format is correct
- Check server logs for API errors

### "Import failed"

- Verify CSV format matches the example
- Check that required columns are present
- Ensure type values are exactly "residential" or "commercial"
- Check server logs for validation errors

### Server Connection Issues

- Ensure backend is running on port 3001
- Check CORS settings in `server/src/index.ts`
- Verify `VITE_API_URL` matches your backend URL

## Security Notes

⚠️ **Important Security Considerations:**

1. **Service Role Key**: Never expose in client-side code
2. **RLS Policies**: Customize based on your organization model
3. **Geocoding API**: Set up usage quotas and restrictions
4. **Rate Limiting**: Consider implementing on geocoding endpoints

## Next Steps

- [ ] Customize RLS policies for organization-scoped access
- [ ] Add organization_id foreign key to locations table
- [ ] Implement rate limiting for geocoding
- [ ] Add location categories/tags
- [ ] Integrate with route planning
- [ ] Add map visualization

## Support

For issues or questions:
1. Check server logs: `npm run server`
2. Check browser console
3. Review Supabase logs in dashboard
4. Verify all environment variables are set

---

**Generated:** 2025-10-05
**Version:** 1.0.0
