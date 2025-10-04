import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import TeamMembers from '@/pages/TeamMembers'
import Onboarding from '@/pages/Onboarding'
import AcceptInvite from '@/pages/AcceptInvite'
import ResetPassword from '@/pages/ResetPassword'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { Toaster } from '@/components/ui/toaster'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/projects', element: <Projects /> },
  { path: '/profile', element: <Profile /> },
  { path: '/settings', element: <Settings /> },
  { path: '/team', element: <TeamMembers /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/invite/:token', element: <AcceptInvite /> },
  { path: '/reset-password', element: <ResetPassword /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OrganizationProvider>
      <RouterProvider router={router} />
      <Toaster />
    </OrganizationProvider>
  </React.StrictMode>,
)
