import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import NavBar from '@/components/NavBar'
import AuthGate from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@supabase/supabase-js'
import { Folder, Users, Building2, Plus } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [projectCount, setProjectCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const { currentOrganization } = useOrganization()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    if (currentOrganization) {
      fetchStats()
    }
  }, [currentOrganization])

  const fetchStats = async () => {
    if (!currentOrganization) return

    // Get project count
    const { count: projects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrganization.id)

    setProjectCount(projects || 0)

    // Get member count
    const { count: members } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrganization.id)

    setMemberCount(members || 0)
  }

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
            <div className="mb-8">
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.email}
              </p>
            </div>

            {currentOrganization ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Current Organization</CardTitle>
                        <CardDescription>Your active workspace</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{currentOrganization.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Role: {currentOrganization.role}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Route Projects</CardTitle>
                        <CardDescription>Total route projects in organization</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{projectCount}</p>
                    <Button variant="link" asChild className="h-auto p-0 text-sm">
                      <Link to="/projects">
                        View all route projects →
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>People in your organization</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{memberCount}</p>
                    <Button variant="link" asChild className="h-auto p-0 text-sm">
                      <Link to="/team">
                        Manage team →
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">No organization selected</p>
                      <p className="text-sm text-muted-foreground">
                        Create or join an organization to get started
                      </p>
                    </div>
                    <Button asChild>
                      <Link to="/onboarding">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </AuthGate>
  )
}
