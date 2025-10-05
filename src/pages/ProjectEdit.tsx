import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import type { Database } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import AuthGate from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()
  const { currentOrganization } = useOrganization()

  useEffect(() => {
    if (currentOrganization && id) {
      fetchProject()
    }
  }, [currentOrganization, id])

  const fetchProject = async () => {
    if (!currentOrganization || !id) return

    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', currentOrganization.id)
      .single()

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
      navigate('/projects')
    } else {
      setProject(data)
      setName(data.name)
      setDescription(data.description || '')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Project name is required'
      })
      return
    }

    if (!id) return

    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({
        name,
        description
      })
      .eq('id', id)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } else {
      toast({
        title: 'Success',
        description: 'Project updated successfully'
      })
      navigate('/projects')
    }
    setSaving(false)
  }

  if (!currentOrganization) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-muted/20">
          <NavBar />
          <main className="container mx-auto px-4 py-12">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Please select an organization</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-muted/20">
        <NavBar />
        <main className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/projects')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <h1 className="text-4xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground">Update your project details</p>
          </div>

          {loading ? (
            <Card className="max-w-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Manage the basic information for this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="A brief description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/projects')}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AuthGate>
  )
}
