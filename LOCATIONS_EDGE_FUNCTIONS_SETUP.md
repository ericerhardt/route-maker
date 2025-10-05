# Locations with Edge Functions - Setup Guide

## Overview

The Locations module now uses **Supabase Edge Functions** for geocoding and address autocomplete instead of Express backend. This works seamlessly on Vercel with no additional backend deployment needed.

## What Was Implemented

### ✅ Supabase Edge Functions

1. **`geocode`** - Geocoding service
   - Single location GPS update
   - Bulk location GPS updates
   - Direct address geocoding

2. **`geocode-autocomplete`** - Address search/autocomplete
   - Real-time address suggestions as you type
   - Supports OpenCage and Google APIs

### ✅ Frontend Components

1. **AddressAutocomplete Component**
   - Real-time address search
   - Dropdown suggestions
   - Integrated into LocationForm

2. **Updated API Client**
   - Uses Supabase Edge Functions via `supabase.functions.invoke()`
   - No Express backend required
   - Works on Vercel out of the box

## Deployment Steps

### 1. Edge Functions Are Already Deployed ✅

```bash
supabase functions deploy geocode
supabase functions deploy geocode-autocomplete
```

### 2. Set Geocoding Secrets

You need to add your geocoding API key to Supabase secrets:

```bash
# Already set:
supabase secrets set GEOCODING_PROVIDER=opencage

# YOU NEED TO RUN THIS:
supabase secrets set GEOCODING_API_KEY=your_opencage_api_key_here
```

**Get an OpenCage API Key:**
1. Sign up at https://opencagedata.com
2. Free tier: 2,500 requests/day
3. Copy your API key
4. Run the command above

**OR use Google Maps:**
```bash
supabase secrets set GEOCODING_PROVIDER=google
supabase secrets set GEOCODING_API_KEY=your_google_maps_api_key_here
```

### 3. Verify Deployment

Check that functions are deployed:
```bash
supabase functions list
```

You should see:
- `geocode`
- `geocode-autocomplete`

## How It Works

### Address Autocomplete

When user types in the "Address Line 1" field:

1. Frontend calls `geocode-autocomplete` Edge Function
2. Edge Function queries OpenCage/Google API
3. Returns address suggestions
4. User selects from dropdown

### GPS Geocoding

When user clicks "Update GPS":

1. Frontend calls `geocode` Edge Function with location ID
2. Edge Function:
   - Fetches location from database
   - Builds full address string
   - Calls geocoding API
   - Updates location with lat/lng
3. Returns updated location

## Features

### ✅ Working Features

- **CRUD Operations** - Create, Read, Update, Delete locations
- **CSV Import** - Bulk import locations
- **Single GPS Update** - Geocode one location
- **Bulk GPS Update** - Geocode multiple locations
- **Address Autocomplete** - Search addresses as you type
- **Organization Filtering** - Multi-tenant support

### Architecture Benefits

- ✅ No Express backend needed
- ✅ Works on Vercel without configuration
- ✅ Serverless - scales automatically
- ✅ Same Supabase credentials as everything else
- ✅ No CORS issues
- ✅ Built-in authentication via Supabase

## Testing

### 1. Test Address Autocomplete

1. Go to Locations page
2. Click "New Location"
3. Start typing in "Address Line 1" field
4. You should see address suggestions appear
5. Select an address from the dropdown

### 2. Test GPS Geocoding

**Single Location:**
1. Create a location with a valid address
2. Click ⋮ menu → "Update GPS"
3. Location should update with coordinates

**Bulk Update:**
1. Create multiple locations
2. Select checkboxes for multiple locations
3. Click "Update GPS (X)" button
4. All selected locations should be geocoded

## Environment Variables

### Supabase Secrets (Edge Functions)

These are set via `supabase secrets set`:

```
GEOCODING_PROVIDER=opencage
GEOCODING_API_KEY=your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Vercel Environment Variables (Frontend)

No changes needed! Uses existing Supabase config:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=https://your-app.vercel.app
```

Note: **VITE_API_URL is NOT needed** - everything uses Supabase!

## Troubleshooting

### "GEOCODING_API_KEY not configured"

**Cause:** API key not set in Supabase secrets

**Fix:**
```bash
supabase secrets set GEOCODING_API_KEY=your_key_here
```

### Address autocomplete not working

**Cause:** Edge Function not deployed or API key missing

**Fix:**
1. Check deployment: `supabase functions list`
2. Check secrets: `supabase secrets list`
3. Redeploy if needed: `supabase functions deploy geocode-autocomplete`

### GPS update fails

**Cause:** Invalid API key or rate limit exceeded

**Fix:**
1. Verify API key is correct
2. Check your geocoding API dashboard for usage/limits
3. Try a different provider (Google vs OpenCage)

## API Rate Limits

### OpenCage (Free Tier)
- 2,500 requests/day
- 1 request/second

### Google Maps Geocoding
- $200 free credit/month
- ~40,000 free requests/month

## Files Created/Modified

### Edge Functions
- `supabase/functions/geocode/index.ts`
- `supabase/functions/geocode-autocomplete/index.ts`

### Frontend
- `src/features/locations/api/locationsClient.ts` - Updated to use Edge Functions
- `src/features/locations/components/AddressAutocomplete.tsx` - New component
- `src/features/locations/components/LocationForm.tsx` - Integrated autocomplete

### Configuration
- `vercel.json` - Reverted to simple config (no API routing needed)

## Comparison: Before vs After

### Before (Express Backend)
```
Frontend → Express API → Geocoding API → Database
         ↓
    Need to deploy Express
    Need VITE_API_URL
    CORS configuration
    Separate environment vars
```

### After (Edge Functions)
```
Frontend → Edge Function → Geocoding API → Database
         ↓
    Deploy with `supabase functions deploy`
    Uses Supabase credentials
    No CORS issues
    Works on Vercel immediately
```

## Next Steps

1. ✅ Edge Functions deployed
2. ✅ Frontend updated
3. ⚠️  **Set your GEOCODING_API_KEY secret**
4. ✅ Test locally
5. Deploy to Vercel (just push to git)

## Get Your API Key

**OpenCage (Recommended for Development):**
1. Sign up: https://opencagedata.com/users/sign_up
2. Verify email
3. Copy API key from dashboard
4. Run: `supabase secrets set GEOCODING_API_KEY=YOUR_KEY`

**Google Maps:**
1. Go to: https://console.cloud.google.com
2. Enable Geocoding API
3. Create API key
4. Run: `supabase secrets set GEOCODING_PROVIDER=google GEOCODING_API_KEY=YOUR_KEY`

---

**Last Updated:** 2025-10-05
**Version:** 3.0.0 (Edge Functions)
