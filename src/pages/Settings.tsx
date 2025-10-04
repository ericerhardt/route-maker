import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import NavBar from '@/components/NavBar'
import AuthGate from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const { currentOrganization, refreshOrganizations } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name)
      setLoading(false)
    }
  }, [currentOrganization])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', currentOrganization.id)

      if (error) throw error

      await refreshOrganizations()

      toast({
        title: 'Success',
        description: 'Organization settings updated'
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentOrganization) return
    if (confirmDelete !== currentOrganization.name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Organization name does not match'
      })
      return
    }

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', currentOrganization.id)

      if (error) throw error

      await refreshOrganizations()

      toast({
        title: 'Organization deleted',
        description: 'Your organization has been permanently deleted'
      })

      navigate('/dashboard')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
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

  const isOwner = currentOrganization.role === 'owner'
  const isAdmin = currentOrganization.role === 'owner' || currentOrganization.role === 'admin'

  return (
    <AuthGate>
      <div className="min-h-screen bg-muted/20">
        <NavBar />
        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold">Organization Settings</h1>
              <p className="text-muted-foreground">
                Manage settings for {currentOrganization.name}
              </p>
            </div>

            <div className="space-y-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>
                        Update your organization information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          placeholder="Acme Inc."
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          disabled={!isAdmin}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">Organization Slug</Label>
                        <Input
                          id="slug"
                          value={currentOrganization.slug}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Organization slug cannot be changed
                        </p>
                      </div>

                      {isAdmin && (
                        <Button type="submit" disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              {isOwner && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Organization
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the
                            organization and all associated data.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm">
                            Please type <strong>{currentOrganization.name}</strong> to confirm.
                          </p>
                          <Input
                            placeholder="Organization name"
                            value={confirmDelete}
                            onChange={(e) => setConfirmDelete(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            disabled={deleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting || confirmDelete !== currentOrganization.name}
                          >
                            {deleting ? 'Deleting...' : 'Delete Organization'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </AuthGate>
  )
}
