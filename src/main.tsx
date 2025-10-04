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
