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
import { LocationsTable } from '../components/LocationsTable'
import { LocationForm } from '../components/LocationForm'
import { ViewDrawer } from '../components/ViewDrawer'
import { ImportDialog } from '../components/ImportDialog'
import { locationsApi } from '../api/locationsClient'
import type { Location, LocationFormData, CsvLocation } from '../schema'
import { Plus, Upload, Navigation, Loader2 } from 'lucide-react'

export default function LocationsPage() {
  const { currentOrganization } = useOrganization()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  // Current location being edited/viewed
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

  // Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkGeocoding, setIsBulkGeocoding] = useState(false)

  // Load locations when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      loadLocations()
    }
  }, [currentOrganization?.id])

  const loadLocations = async () => {
    if (!currentOrganization?.id) return

    try {
      setLoading(true)
      const data = await locationsApi.list(currentOrganization.id)
      setLocations(data)
    } catch (error) {
      toast.error('Failed to load locations')
      console.error('Load locations error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create location
  const handleCreate = async (data: LocationFormData) => {
    if (!currentOrganization?.id) return

    try {
      setIsSubmitting(true)
      const newLocation = await locationsApi.create(currentOrganization.id, data)
      setLocations([newLocation, ...locations])
      toast.success('Location created successfully')
      setCreateOpen(false)
    } catch (error) {
      toast.error('Failed to create location')
      console.error('Create location error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update location
  const handleUpdate = async (data: LocationFormData) => {
    if (!currentLocation?.id) return

    try {
      setIsSubmitting(true)
      const updated = await locationsApi.update(currentLocation.id, data)
      setLocations(locations.map((loc) => (loc.id === updated.id ? updated : loc)))
      toast.success('Location updated successfully')
      setEditOpen(false)
      setCurrentLocation(null)
    } catch (error) {
      toast.error('Failed to update location')
      console.error('Update location error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete location
  const handleDelete = async (location: Location) => {
    if (!location.id) return
    if (!confirm(`Delete "${location.name}"?`)) return

    try {
      await locationsApi.delete(location.id)
      setLocations(locations.filter((loc) => loc.id !== location.id))
      toast.success('Location deleted successfully')
    } catch (error) {
      toast.error('Failed to delete location')
      console.error('Delete location error:', error)
    }
  }

  // View location
  const handleView = (location: Location) => {
    setCurrentLocation(location)
    setViewOpen(true)
  }

  // Edit location
  const handleEdit = (location: Location) => {
    setCurrentLocation(location)
    setEditOpen(true)
  }

  // Update GPS for single location
  const handleUpdateGPS = async (location: Location) => {
    if (!location.id) return

    try {
      const loadingToast = toast.loading('Geocoding address...')
      const updated = await locationsApi.geocode(location.id)
      setLocations(locations.map((loc) => (loc.id === updated.id ? updated : loc)))
      toast.dismiss(loadingToast)
      toast.success('GPS coordinates updated')
    } catch (error) {
      toast.error('Failed to update GPS')
      console.error('Geocode error:', error)
    }
  }

  // Bulk update GPS
  const handleBulkUpdateGPS = async () => {
    if (selectedRows.length === 0) {
      toast.error('Please select locations to geocode')
      return
    }

    try {
      setIsBulkGeocoding(true)
      const loadingToast = toast.loading(`Geocoding ${selectedRows.length} location(s)...`)

      const result = await locationsApi.geocodeBulk(selectedRows)

      // Reload locations to get updated coordinates
      await loadLocations()

      toast.dismiss(loadingToast)

      if (result.failed === 0) {
        toast.success(`Successfully geocoded ${result.success} location(s)`)
      } else {
        toast.warning(
          `Geocoded ${result.success} location(s). ${result.failed} failed.`,
          {
            description: result.errors.length > 0 ? result.errors[0].error : undefined,
          }
        )
      }

      setSelectedRows([])
    } catch (error) {
      toast.error('Bulk geocoding failed')
      console.error('Bulk geocode error:', error)
    } finally {
      setIsBulkGeocoding(false)
    }
  }

  // Import locations from CSV
  const handleImport = async (csvLocations: CsvLocation[]) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return { success: 0, failed: csvLocations.length, errors: [] }
    }

    const result = await locationsApi.import(currentOrganization.id, csvLocations)

    // Reload locations
    await loadLocations()

    if (result.failed === 0) {
      toast.success(`Successfully imported ${result.success} location(s)`)
    } else {
      toast.warning(
        `Imported ${result.success} location(s). ${result.failed} failed.`,
        {
          description: 'Check the import dialog for details',
        }
      )
    }

    return result
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
                <h1 className="text-4xl font-bold">Locations</h1>
                <p className="mt-2 text-muted-foreground">
                  Manage residential and commercial locations
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRows.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBulkUpdateGPS}
                    disabled={isBulkGeocoding}
                  >
                    {isBulkGeocoding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Geocoding...
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4" />
                        Update GPS ({selectedRows.length})
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Location
                </Button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <LocationsTable
                data={locations}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdateGPS={handleUpdateGPS}
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
              />
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Location</DialogTitle>
            <DialogDescription>Add a new location to your database</DialogDescription>
          </DialogHeader>
          <LocationForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details</DialogDescription>
          </DialogHeader>
          <LocationForm
            initialData={currentLocation || undefined}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditOpen(false)
              setCurrentLocation(null)
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <ViewDrawer
        location={currentLocation}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setCurrentLocation(null)
        }}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />
    </AuthGate>
  )
}
