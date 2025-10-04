import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import type { Database } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import AuthGate from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, MoreVertical, Pencil, Trash2, Folder } from 'lucide-react'

type Project = Database['public']['Tables']['projects']['Row']

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const { toast } = useToast()
  const { currentOrganization } = useOrganization()

  useEffect(() => {
    if (currentOrganization) {
      fetchProjects()
    }
  }, [currentOrganization])

  const fetchProjects = async () => {
    if (!currentOrganization) return

    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newProjectName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Project name is required'
      })
      return
    }

    if (!currentOrganization) return

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectName,
        description: newProjectDescription,
        organization_id: currentOrganization.id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } else {
      setProjects([data, ...projects])
      toast({
        title: 'Success',
        description: 'Project created'
      })
      setNewProjectName('')
      setNewProjectDescription('')
      setCreateOpen(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingProject) return

    const { error } = await supabase
      .from('projects')
      .update({
        name: newProjectName,
        description: newProjectDescription
      })
      .eq('id', editingProject.id)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } else {
      setProjects(
        projects.map((p) =>
          p.id === editingProject.id
            ? { ...p, name: newProjectName, description: newProjectDescription }
            : p
        )
      )
      toast({
        title: 'Success',
        description: 'Project updated'
      })
      setEditOpen(false)
      setEditingProject(null)
      setNewProjectName('')
      setNewProjectDescription('')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } else {
      setProjects(projects.filter((p) => p.id !== id))
      toast({
        title: 'Success',
        description: 'Project deleted'
      })
    }
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setNewProjectDescription(project.description || '')
    setEditOpen(true)
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Manage projects for {currentOrganization.name}</p>
            </div>
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
                  <DialogDescription>Add a new project to your organization</DialogDescription>
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
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No projects yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first project to get started
                    </p>
                  </div>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </div>
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
                  <Card className="hover:border-primary/50 transition-colors">
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
  )
}
