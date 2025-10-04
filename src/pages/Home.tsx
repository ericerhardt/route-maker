import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import NavBar from '@/components/NavBar'
import { ArrowRight, Building2, Users, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <NavBar />
      <main className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="mb-6 text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">RouteMaker</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            A modern, multi-tenant SaaS platform powered by React, Vite, Tailwind, shadcn/ui, and Supabase.
            Built for teams that move fast.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/projects">View Features</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-lg border bg-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold">Multi-Tenant</h3>
            <p className="text-sm text-muted-foreground">
              Isolated organizations with full data separation and role-based access
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold">Team Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Invite team members with different roles and permissions
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold">Secure by Default</h3>
            <p className="text-sm text-muted-foreground">
              Row-level security policies ensure data is always protected
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Built with Vite and optimized for performance
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
