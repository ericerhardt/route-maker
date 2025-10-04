import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center max-w-xl">
        <motion.h1 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}}
          className="text-3xl font-bold mb-3">
          Vite + React + Supabase + shadcn/ui
        </motion.h1>
        <p className="text-muted-foreground mb-6">
          Minimal starter with Supabase auth & CRUD-ready structure.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <a className="underline" href="https://supabase.com/docs">Supabase Docs</a>
          <Link className="underline" to="/dashboard">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
