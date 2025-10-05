import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import NavBar from '@/components/NavBar'
import AuthGate from '@/components/AuthGate'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TechniciansTable } from '../components/TechniciansTable'
import { TechnicianForm } from '../components/TechnicianForm'
import { ViewDrawer } from '../components/ViewDrawer'
import { techniciansApi } from '../api/techniciansClient'
import type { Technician, TechnicianFormData } from '../schema'
import { Plus, Users, Loader2 } from 'lucide-react'

export default function TechniciansPage() {
  const { currentOrganization } = useOrganization()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Current technician being edited/viewed/deleted
  const [currentTechnician, setCurrentTechnician] = useState<Technician | null>(null)

  // Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load technicians when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      loadTechnicians()
    }
  }, [currentOrganization?.id])

  const loadTechnicians = async () => {
    if (!currentOrganization?.id) return

    try {
      setLoading(true)
      const result = await techniciansApi.list(currentOrganization.id, {
        pageSize: 1000, // Load all for now; can add proper pagination later
      })
      setTechnicians(result.data)
    } catch (error) {
      toast.error('Failed to load technicians')
      console.error('Load technicians error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create technician
  const handleCreate = async (data: TechnicianFormData) => {
    if (!currentOrganization?.id) return

    try {
      setIsSubmitting(true)
      const newTechnician = await techniciansApi.create(currentOrganization.id, data)
      setTechnicians([newTechnician, ...technicians])
      toast.success('Technician created successfully')
      setCreateOpen(false)
    } catch (error) {
      toast.error('Failed to create technician')
      console.error('Create technician error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update technician
  const handleUpdate = async (data: TechnicianFormData) => {
    if (!currentTechnician?.id) return

    try {
      setIsSubmitting(true)
      const updated = await techniciansApi.update(currentTechnician.id, data)
      setTechnicians(technicians.map((tech) => (tech.id === updated.id ? updated : tech)))
      toast.success('Technician updated successfully')
      setEditOpen(false)
      setCurrentTechnician(null)
    } catch (error) {
      toast.error('Failed to update technician')
      console.error('Update technician error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete technician
  const handleDeleteConfirm = async () => {
    if (!currentTechnician?.id) return

    try {
      await techniciansApi.delete(currentTechnician.id)
      setTechnicians(technicians.filter((tech) => tech.id !== currentTechnician.id))
      toast.success('Technician deleted successfully')
      setDeleteOpen(false)
      setCurrentTechnician(null)
    } catch (error) {
      toast.error('Failed to delete technician')
      console.error('Delete technician error:', error)
    }
  }

  // View technician
  const handleView = (technician: Technician) => {
    setCurrentTechnician(technician)
    setViewOpen(true)
  }

  // Edit technician
  const handleEdit = (technician: Technician) => {
    setCurrentTechnician(technician)
    setEditOpen(true)
  }

  // Delete technician (show confirmation)
  const handleDelete = (technician: Technician) => {
    setCurrentTechnician(technician)
    setDeleteOpen(true)
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
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-4xl font-bold">
                  <Users className="h-8 w-8" />
                  Technicians
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Manage contractors and employees for route assignments
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Technician
              </Button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TechniciansTable
                data={technicians}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </motion.div>
        </main>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
              <DialogDescription>
                Create a new contractor or employee record with contact and cost information
              </DialogDescription>
            </DialogHeader>
            <TechnicianForm
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Technician</DialogTitle>
              <DialogDescription>Update technician information</DialogDescription>
            </DialogHeader>
            <TechnicianForm
              initialData={currentTechnician || undefined}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditOpen(false)
                setCurrentTechnician(null)
              }}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* View Drawer */}
        <ViewDrawer
          technician={currentTechnician}
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open)
            if (!open) setCurrentTechnician(null)
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Technician?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>{currentTechnician?.full_name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteOpen(false)
                  setCurrentTechnician(null)
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGate>
  )
}
