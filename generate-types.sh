#!/bin/bash

# Script to generate TypeScript types from Supabase
# You'll need to get your database password from:
# https://supabase.com/dashboard/project/kpwyxqpiwrygsjnlaxkm/settings/database

echo "To generate types, you need your database password."
echo ""
echo "Option 1: Get password and run:"
echo "  supabase gen types typescript --db-url 'postgresql://postgres:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres' > src/lib/database.types.ts"
echo ""
echo "Option 2: Use access token:"
echo "  1. Get token from: https://supabase.com/dashboard/account/tokens"
echo "  2. Run: supabase login --token [TOKEN]"
echo "  3. Run: supabase link --project-ref kpwyxqpiwrygsjnlaxkm"
echo "  4. Run: supabase gen types typescript --linked > src/lib/database.types.ts"
echo ""
