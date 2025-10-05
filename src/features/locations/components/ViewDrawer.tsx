import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { MapPin, Home, Building2, Calendar, FileText } from 'lucide-react'
import type { Location } from '../schema'

interface ViewDrawerProps {
  location: Location | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDrawer({ location, open, onOpenChange }: ViewDrawerProps) {
  if (!location) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {location.type === 'residential' ? (
              <Home className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            {location.name}
          </SheetTitle>
          <SheetDescription>Location details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Type & Status */}
          <div className="flex items-center gap-2">
            <Badge variant={location.type === 'residential' ? 'default' : 'secondary'}>
              {location.type}
            </Badge>
            <Badge variant={location.is_active ? 'default' : 'outline'}>
              {location.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
            <div className="rounded-lg border p-4">
              <div>{location.address_line1}</div>
              {location.address_line2 && (
                <div className="text-muted-foreground">{location.address_line2}</div>
              )}
              <div>
                {location.city}, {location.state} {location.postal_code}
              </div>
              <div className="text-muted-foreground">{location.country}</div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              GPS Coordinates
            </h3>
            <div className="rounded-lg border p-4">
              {location.latitude && location.longitude ? (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-mono">{location.latitude.toFixed(7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-mono">{location.longitude.toFixed(7)}</span>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No GPS coordinates available
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {location.notes && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="rounded-lg border p-4">
                <p className="text-sm">{location.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Metadata
            </h3>
            <div className="rounded-lg border p-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(location.created_at)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(location.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
