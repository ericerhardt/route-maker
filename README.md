# RouteMaker - Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and Express.

## ✨ Features

### 🏢 Multi-Tenancy
- **Organizations**: Create and manage multiple organizations
- **Role-Based Access Control**: Owner, Admin, and Member roles
- **Data Isolation**: Row-Level Security (RLS) ensures complete data separation
- **Organization Switching**: Seamlessly switch between organizations

### 👥 Team Collaboration
- **Team Invitations**: Invite members via email with token-based invites
- **Member Management**: Add, remove, and update team member roles
- **Profile Management**: User profiles with customizable information

### 🔐 Authentication & Security
- **Email/Password Authentication**: Powered by Supabase Auth
- **Password Reset**: Self-service password recovery
- **Session Management**: Automatic token refresh and session handling
- **Row-Level Security**: Database-level security policies

### 🎨 Modern UI/UX
- **shadcn/ui Components**: Beautiful, accessible components
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration in SQL Editor:
   ```sql
   -- Copy and execute: supabase/migrations/20250104_multi_tenant_setup.sql
   ```
3. Get your API credentials from Settings → API

### 3. Environment Variables
Create `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=http://localhost:5173
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## 📚 Documentation

For full documentation, see [CLAUDE.md](./CLAUDE.md)

## 🏗️ Tech Stack

**Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
**Backend:** Supabase (PostgreSQL, Auth, RLS), Express (optional)
**Deployment:** Vercel

## 🔒 Security

- Row-Level Security on all tables
- JWT-based authentication
- Secure password reset flow
- Environment variable protection

## 📖 Key Pages

- `/` - Landing page
- `/dashboard` - User dashboard
- `/projects` - Project management
- `/team` - Team member management
- `/settings` - Organization settings
- `/profile` - User profile
- `/onboarding` - First-time user setup

## 🛠️ Development

```bash
# Frontend only
npm run dev

# Backend (optional)
npm run server

# Both
npm run dev:all

# Type checking
npm run type-check

# Build
npm run build
```

## 📝 License

MIT License - See [LICENSE](./LICENSE)

---

Built with ❤️ using React, Vite, Supabase, and shadcn/ui
