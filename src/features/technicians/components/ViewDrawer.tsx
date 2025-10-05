import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Palette,
} from 'lucide-react'
import type { Technician } from '../schema'

interface ViewDrawerProps {
  technician: Technician | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDrawer({ technician, open, onOpenChange }: ViewDrawerProps) {
  if (!technician) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getCostLabel = () => {
    const hints = {
      hourly: '/hr',
      salary: '/yr',
      per_stop: '/stop',
      other: '',
    }
    return `$${technician.cost_amount.toFixed(2)}${hints[technician.cost_basis]}`
  }

  const hasAddress =
    technician.address_line1 ||
    technician.city ||
    technician.state ||
    technician.postal_code

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {technician.full_name}
          </SheetTitle>
          <SheetDescription>Technician details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Type & Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={technician.employment_type === 'employee' ? 'default' : 'secondary'}
            >
              {technician.employment_type === 'employee' ? 'Employee' : 'Contractor'}
            </Badge>
            <Badge variant={technician.active ? 'default' : 'outline'}>
              {technician.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Contact Information */}
          {(technician.email || technician.phone) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
              <div className="rounded-lg border p-4 space-y-3">
                {technician.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${technician.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {technician.email}
                    </a>
                  </div>
                )}
                {technician.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${technician.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {technician.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {hasAddress && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Address
              </h3>
              <div className="rounded-lg border p-4">
                {technician.address_line1 && <div>{technician.address_line1}</div>}
                {technician.address_line2 && (
                  <div className="text-muted-foreground">{technician.address_line2}</div>
                )}
                {(technician.city || technician.state || technician.postal_code) && (
                  <div>
                    {technician.city}
                    {technician.city && technician.state && ', '}
                    {technician.state} {technician.postal_code}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost Information */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Cost Information
            </h3>
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {technician.cost_basis === 'per_stop' ? 'Per Stop' : technician.cost_basis}
                  </div>
                  <div className="text-2xl font-semibold">{getCostLabel()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Color */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette className="h-4 w-4" />
              Map Color
            </h3>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-lg border border-gray-300"
                  style={{ backgroundColor: technician.color_hex }}
                />
                <div>
                  <div className="text-sm text-muted-foreground">Hex Code</div>
                  <div className="font-mono text-lg">{technician.color_hex}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This color represents the technician on route maps
              </p>
            </div>
          </div>

          {/* Notes */}
          {technician.notes && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="rounded-lg border p-4">
                <p className="text-sm whitespace-pre-wrap">{technician.notes}</p>
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
                <span>{formatDate(technician.created_at)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(technician.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
