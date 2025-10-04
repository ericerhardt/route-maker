# React + Vite + Tailwind + shadcn/ui + Supabase + Vercel Stack Guide

## Overview

This guide walks you through building and deploying a production-ready web application using **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase** (database, auth, RLS), and **Vercel** hosting. You'll ship a minimal but complete authentication + CRUD example centered around a "Projects" resource.

**Features:**
- Email/password authentication with Supabase Auth
- Protected routes with session management
- CRUD operations on a `projects` table with Row Level Security
- Clean, accessible UI with shadcn/ui components
- Smooth micro-transitions with Framer Motion
- Production deployment on Vercel with environment variables

---

## Prerequisites

- **Node.js** v18+ (recommend v20+)
- **pnpm**, **npm**, or **yarn** (examples use `pnpm`)
- **Git** installed
- **Accounts:**
  - [Vercel](https://vercel.com) (free tier)
  - [Supabase](https://supabase.com) (free tier)

---

## 1. Scaffold Project

### 1.1 Create Vite App

```bash
pnpm create vite <PROJECT_NAME> --template react-ts
cd <PROJECT_NAME>
```

### 1.2 Install Core Dependencies

```bash
pnpm install @supabase/supabase-js react-router-dom
```

### 1.3 Install Tailwind CSS

```bash
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.4 Install UI Dependencies

```bash
pnpm install class-variance-authority clsx tailwind-merge lucide-react framer-motion
pnpm install zod react-hook-form @hookform/resolvers
```

### 1.5 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

**When prompted:**
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`
- Path alias: `@/components` → confirm `@` maps to `./src`

This creates `components.json` and sets up your config.

### 1.6 Add shadcn/ui Components

```bash
npx shadcn@latest add button input card dialog label form dropdown-menu sheet skeleton toast
```

### 1.7 Initialize Git

```bash
git init
git add .
git commit -m "Initial scaffold"
```

---

## 2. Tailwind Setup

### 2.1 `tailwind.config.ts`

Replace contents with:

```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

Install `tailwindcss-animate`:

```bash
pnpm install -D tailwindcss-animate
```

### 2.2 `postcss.config.js`

Should already exist from `npx tailwindcss init -p`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 2.3 `src/index.css`

Replace contents:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 3. Project Structure

Your final structure should look like:

```
<PROJECT_NAME>/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   ├── AuthGate.tsx
│   │   └── NavBar.tsx
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── Projects.tsx
│   ├── routes.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .env
├── .gitignore
├── components.json
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### 3.1 `vite.config.ts`

Replace with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.2 `tsconfig.json`

Ensure `compilerOptions` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 4. Supabase Setup

### 4.1 Create Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `<PROJECT_NAME>`
3. Database password: (save it)
4. Region: choose closest
5. Wait ~2 min for provisioning

### 4.2 Enable Auth Providers

1. Navigate to **Authentication** → **Providers**
2. Enable **Email** (enabled by default)
3. *(Optional)* Enable **GitHub** OAuth:
   - Create a GitHub OAuth app
   - Copy Client ID & Secret into Supabase
   - Set callback URL to `https://<YOUR_SUPABASE_URL>/auth/v1/callback`

### 4.3 Create `projects` Table with RLS

Navigate to **SQL Editor** → **New query** and run:

```sql
-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policies
create policy "Users can select own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();
```

### 4.4 Get API Keys

1. **Settings** → **API**
2. Copy:
   - **Project URL** → `<YOUR_SUPABASE_URL>`
   - **anon/public** key → `<YOUR_SUPABASE_ANON_KEY>`

---

## 5. Environment Variables

### 5.1 `.env` (local)

Create `.env` in project root:

```bash
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
VITE_SITE_URL=http://localhost:5173
```

**Important:** Vite requires `VITE_` prefix. Access via `import.meta.env.VITE_*`.

Add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### 5.2 Vercel Environment Variables

Later, when deploying to Vercel, set these in **Project Settings** → **Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` → `https://your-app.vercel.app`

---

## 6. Supabase Client

### 6.1 `src/lib/supabaseClient.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
```

### 6.2 `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 7. UI & Routing

### 7.1 Install React Router

```bash
pnpm install react-router-dom
```

### 7.2 `src/routes.tsx`

```tsx
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/projects',
    element: <Projects />,
  },
]);
```

### 7.3 `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from '@/components/ui/toaster';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);
```

---

## 8. Components

### 8.1 `src/components/NavBar.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function NavBar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          <PROJECT_NAME>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/projects">Projects</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/dashboard">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
```

### 8.2 `src/components/AuthGate.tsx`

```tsx
import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Session } from '@supabase/supabase-js';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/dashboard`,
          },
        });
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Signed in',
          description: 'Welcome back!',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Enter your credentials to access your account'
                : 'Create a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Note:** You'll need to create `src/hooks/use-toast.ts`. The shadcn CLI should have created this. If not:

```tsx
// src/hooks/use-toast.ts
import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useToast, toast };
```

---

## 9. Pages

### 9.1 `src/pages/Home.tsx`

```tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <NavBar />
      <main className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Welcome to <span className="text-primary"><PROJECT_NAME></span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            A modern, production-ready stack powered by React, Vite, Tailwind, shadcn/ui, and
            Supabase. Build fast, ship faster.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/projects">View Projects</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
```

### 9.2 `src/pages/Dashboard.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import NavBar from '@/components/NavBar';
import AuthGate from '@/components/AuthGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { Folder } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <AuthGate>
      <div className="min-h-screen bg-muted/20">
        <NavBar />
        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back!</CardTitle>
                  <CardDescription>
                    Signed in as <strong>{user?.email}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your account is active and ready to use. Explore your projects or create a new
                    one.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Projects
                  </CardTitle>
                  <CardDescription>Manage your personal projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link to="/projects">Go to Projects</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </AuthGate>
  );
}
```

### 9.3 `src/pages/Projects.tsx`

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabaseClient';
import NavBar from '@/components/NavBar';
import AuthGate from '@/components/AuthGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Project name is required',
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectName,
        description: newProjectDescription,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setProjects([data, ...projects]);
      toast({
        title: 'Success',
        description: 'Project created',
      });
      setNewProjectName('');
      setNewProjectDescription('');
      setCreateOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject) return;

    const { error } = await supabase
      .from('projects')
      .update({
        name: newProjectName,
        description: newProjectDescription,
      })
      .eq('id', editingProject.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setProjects(
        projects.map((p) =>
          p.id === editingProject.id
            ? { ...p, name: newProjectName, description: newProjectDescription }
            : p
        )
      );
      toast({
        title: 'Success',
        description: 'Project updated',
      });
      setEditOpen(false);
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectDescription('');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setProjects(projects.filter((p) => p.id !== id));
      toast({
        title: 'Success',
        description: 'Project deleted',
      });
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || '');
    setEditOpen(true);
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-muted/20">
        <NavBar />
        <main className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-4xl font-bold">Projects</h1>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>Add a new project to your workspace</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="A brief description"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                  <DialogDescription>Update your project details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      placeholder="My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description (optional)</Label>
                    <Input
                      id="edit-description"
                      placeholder="A brief description"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdate}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No projects yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(project)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
```

---

## 10. Auth Helpers & Advanced Features

### 10.1 Password Reset

To add password reset, extend `AuthGate.tsx` with:

```tsx
const handlePasswordReset = async () => {
  if (!email) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Enter your email first',
    });
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_SITE_URL}/reset-password`,
  });

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message,
    });
  } else {
    toast({
      title: 'Check your email',
      description: 'Password reset link sent',
    });
  }
};
```

Add a "Forgot password?" button in the form and create a `/reset-password` route.

### 10.2 GitHub OAuth

In Supabase **Authentication** → **Providers**, enable GitHub. Then in your auth form:

```tsx
const handleGitHubSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${import.meta.env.VITE_SITE_URL}/dashboard`,
    },
  });

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message,
    });
  }
};
```

Add a button that calls `handleGitHubSignIn`.

---

## 11. Local Dev

### 11.1 `package.json` Scripts

Ensure your `package.json` includes:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

### 11.2 Run Dev Server

```bash
pnpm install
pnpm dev
```

**Expected output:**

```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 12. Vercel Deployment

### 12.1 Install Vercel CLI (optional)

```bash
pnpm install -g vercel
```

### 12.2 Deploy via GitHub (Recommended)

1. Push your repo to GitHub:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<PROJECT_NAME>.git
git branch -M main
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. **Framework Preset:** Vite
4. **Build Command:** `pnpm build` (or `npm run build`)
5. **Output Directory:** `dist`
6. **Environment Variables:** Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL` → `https://your-app.vercel.app`

7. Click **Deploy**

### 12.3 Deploy via CLI

```bash
vercel
```

Follow prompts. Set env vars:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SITE_URL
```

Redeploy:

```bash
vercel --prod
```

### 12.4 Update Supabase Auth URLs

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `http://localhost:5173/**` (for local dev)

---

## 13. Security & Production Notes

### 13.1 Row Level Security (RLS)

- **Always** enable RLS on public tables
- Test policies in Supabase SQL Editor:

```sql
-- Test as a specific user
select * from public.projects where auth.uid() = '<USER_ID>';
```

### 13.2 Service Role Key

- **Never** expose `service_role` key on frontend
- Only use it in server-side API routes (if using Next.js API routes or similar)

### 13.3 Rate Limiting

- Use Vercel Edge Middleware for rate limiting
- Or integrate Cloudflare Turnstile for bot protection

### 13.4 SEO & Meta Tags

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="<PROJECT_NAME> - Your tagline here" />
    <title><PROJECT_NAME></title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 13.5 Environment Variable Checklist

- ✅ `.env` in `.gitignore`
- ✅ Vercel env vars set for Production and Preview
- ✅ `VITE_SITE_URL` matches deployed URL
- ✅ Supabase redirect URLs updated

---

## 14. Appendix: Complete Code Blocks

### 14.1 `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 14.2 Example shadcn/ui Component Import

After running `npx shadcn@latest add button`, you can import:

```tsx
import { Button } from '@/components/ui/button';

<Button variant="outline">Click me</Button>
```

All shadcn components live in `src/components/ui/*` and are auto-generated by the CLI.

### 14.3 Complete `main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from '@/components/ui/toaster';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);
```

### 14.4 Complete `routes.tsx`

```tsx
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/projects',
    element: <Projects />,
  },
]);
```

---

## 15. Troubleshooting

### 15.1 shadcn Import Errors

**Error:** `Cannot find module '@/components/ui/button'`

**Fix:**
- Ensure `vite.config.ts` has `resolve.alias` set
- Check `tsconfig.json` has `paths` mapping `@/*` to `./src/*`
- Restart dev server

### 15.2 Supabase CORS / Auth URL Mismatch

**Error:** `Invalid Redirect URL` or CORS errors

**Fix:**
- Check **Supabase Dashboard** → **Authentication** → **URL Configuration**
- Ensure **Site URL** and **Redirect URLs** include your domain
- Include `http://localhost:5173` for local dev

### 15.3 Vercel Environment Variables Not Available

**Error:** `undefined` when accessing `import.meta.env.VITE_*`

**Fix:**
- Ensure env vars are set in **Vercel Project Settings** → **Environment Variables**
- Redeploy after adding env vars
- Check variable names match exactly (case-sensitive)

### 15.4 Build Fails on Vercel

**Error:** TypeScript errors or missing dependencies

**Fix:**
- Run `pnpm build` locally to test
- Ensure all deps are in `dependencies`, not `devDependencies` (except build tools)
- Check **Vercel Build Settings** → Install Command is `pnpm install` or `npm install`

### 15.5 Toasts Not Appearing

**Error:** `useToast` hook not working

**Fix:**
- Ensure `<Toaster />` is rendered in `main.tsx`
- Check `src/hooks/use-toast.ts` exists and exports `useToast`
- Verify `toast` component is added via `npx shadcn@latest add toast`

---

## Conclusion

You now have a **complete, production-ready** template for building modern web apps with:

- ✅ React 18 + Vite + TypeScript
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Supabase Auth + Database + RLS
- ✅ Framer Motion animations
- ✅ Lucide React icons
- ✅ Vercel deployment with env vars

**Next steps:**
- Customize your `projects` table schema
- Add more pages and features
- Integrate Stripe for payments (via Supabase Edge Functions)
- Set up CI/CD with GitHub Actions

**Happy shipping!** 🚀
