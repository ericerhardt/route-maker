#!/usr/bin/env bash
set -euo pipefail

# ------- Helpers -------
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing dependency: $1"; exit 1; }; }
banner() { echo -e "\n\n==================== $* ====================\n"; }

# ------- Dependencies -------
need node
need npm
need git

# Optional tools (best effort)
HAS_VERCEL=0; command -v vercel >/dev/null 2>&1 && HAS_VERCEL=1
HAS_OP=0; command -v op >/dev/null 2>&1 && HAS_OP=1
HAS_JQ=0; command -v jq >/dev/null 2>&1 && HAS_JQ=1

# ------- Load secrets from 1Password or .env.secrets -------
if [[ -f ".env.secrets" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.secrets | xargs -0 -I {} bash -c 'echo {}' 2>/dev/null || true)
fi

if [[ ${HAS_OP} -eq 1 && -n "${OP_VAULT:-}" && -n "${OP_ITEM_SUPABASE:-}" ]]; then
  banner "Reading secrets from 1Password (vault: ${OP_VAULT}, item: ${OP_ITEM_SUPABASE})"
  # These fields must exist in your 1P item
  export VITE_SUPABASE_URL="$(op read "op://${OP_VAULT}/${OP_ITEM_SUPABASE}/VITE_SUPABASE_URL" 2>/dev/null || true)"
  export VITE_SUPABASE_ANON_KEY="$(op read "op://${OP_VAULT}/${OP_ITEM_SUPABASE}/VITE_SUPABASE_ANON_KEY" 2>/dev/null || true)"
  export VITE_SITE_URL="${VITE_SITE_URL:-$(op read "op://${OP_VAULT}/${OP_ITEM_SUPABASE}/VITE_SITE_URL" 2>/dev/null || echo "http://localhost:5173")}"
fi

# ------- Validate required vars -------
: "${PROJECT_NAME:?Set PROJECT_NAME in .env.secrets or environment}"
: "${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY}"
VITE_SITE_URL="${VITE_SITE_URL:-http://localhost:5173}"
VERCEL_PROJECT_NAME="${VERCEL_PROJECT_NAME:-$PROJECT_NAME}"

# ------- Create project -------
banner "Scaffolding Vite + React + TS"
npm create vite@latest "$PROJECT_NAME" -- --template react-ts >/dev/null

cd "$PROJECT_NAME"

banner "Initialize Git"
git init -q
git checkout -b main >/dev/null 2>&1 || true

banner "Installing dependencies"
npm i -D tailwindcss postcss autoprefixer
npm i @supabase/supabase-js react-router-dom lucide-react framer-motion clsx tailwind-merge class-variance-authority zod react-hook-form
# shadcn/ui CLI
npm i -D shadcn-ui @types/node
npm i @radix-ui/react-slot

banner "Tailwind init"
npx tailwindcss init -p

# ------- Write Tailwind config -------
cat > tailwind.config.ts <<'EOF'
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      }
    }
  },
  plugins: []
}
export default config
EOF

# ------- PostCSS is already created by init - ensure index.css -------
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --radius: 0.75rem;
}
EOF

# ------- Vite alias -------
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
EOF

# ------- Shadcn: components config (non-interactive) -------
mkdir -p src/components/ui
cat > components.json <<'EOF'
{
  "$schema": "https://shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
EOF

banner "Initialize shadcn/ui"
npx shadcn@latest init -y >/dev/null || true
npx shadcn@latest add button input card dialog form label dropdown-menu sheet skeleton toast sonner >/dev/null || true

# ------- Utilities -------
mkdir -p src/lib src/pages src/components
cat > src/lib/utils.ts <<'EOF'
import { type ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# ------- Supabase client -------
cat > src/lib/supabaseClient.ts <<EOF
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
EOF

# ------- Basic routes / app shell -------
cat > src/main.tsx <<'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/projects', element: <Projects /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
EOF

# ------- Pages -------
cat > src/pages/Home.tsx <<'EOF'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center max-w-xl">
        <motion.h1 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="text-3xl font-bold mb-3">
          Vite + React + Supabase + shadcn/ui
        </motion.h1>
        <p className="text-muted-foreground mb-6">
          Minimal starter with Supabase auth & CRUD-ready structure.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Button asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
          <Button variant="outline" asChild><a href="https://supabase.com/docs">Docs</a></Button>
        </div>
      </div>
    </div>
  )
}
EOF

cat > src/pages/Dashboard.tsx <<'EOF'
export default function Dashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-muted-foreground">Wire AuthGate here if you want to protect this view.</p>
    </div>
  )
}
EOF

cat > src/pages/Projects.tsx <<'EOF'
export default function Projects() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">Projects</h2>
      <p className="text-muted-foreground">Replace with Supabase CRUD for your "projects" table.</p>
    </div>
  )
}
EOF

# ------- Env file for local dev -------
cat > .env <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_SITE_URL=${VITE_SITE_URL}
EOF

# ------- First run -------
banner "Local startup"
npm run dev >/dev/null 2>&1 || true

# ------- Commit base -------
git add .
git commit -m "chore: bootstrap Vite+React+Tailwind+shadcn+Supabase" >/dev/null

# ------- Optional: set up Git remote -------
if [[ -n "${GITHUB_REPO_URL:-}" ]]; then
  banner "Configuring remote ${GITHUB_REPO_URL}"
  git remote add origin "$GITHUB_REPO_URL" || true
  git push -u origin main || true
fi

# ------- Optional: Vercel linkage & env push -------
if [[ ${HAS_VERCEL} -eq 1 ]]; then
  banner "Vercel linking (you may be prompted to login/select scope)"
  vercel link --yes >/dev/null || true

  echo "→ Setting Vercel environment variables"
  # Try non-interactive if supported by your CLI version; fall back to manual
  vercel env add VITE_SUPABASE_URL "${VITE_SUPABASE_URL}" production >/dev/null 2>&1 || true
  vercel env add VITE_SUPABASE_ANON_KEY "${VITE_SUPABASE_ANON_KEY}" production >/dev/null 2>&1 || true
  vercel env add VITE_SITE_URL "${VITE_SITE_URL}" production >/dev/null 2>&1 || true

  vercel env add VITE_SUPABASE_URL "${VITE_SUPABASE_URL}" preview >/dev/null 2>&1 || true
  vercel env add VITE_SUPABASE_ANON_KEY "${VITE_SUPABASE_ANON_KEY}" preview >/dev/null 2>&1 || true
  vercel env add VITE_SITE_URL "${VITE_SITE_URL}" preview >/dev/null 2>&1 || true

  echo "→ Deploying to Vercel"
  vercel --prod || true
else
  echo "ℹ️ Vercel CLI not found. Install with: npm i -g vercel"
  echo "   Then run: vercel && set the three VITE_* env vars in Vercel project settings."
fi

banner "Done!"
echo "Project: $PROJECT_NAME"
echo "Local env written to: .env"
echo "Run locally: npm run dev"
