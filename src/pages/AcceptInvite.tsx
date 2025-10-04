import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import AuthGate from '@/components/AuthGate'

interface InvitationData {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  organizations: {
    name: string
    logo_url: string | null
  }
}

export default function AcceptInvite() {
  const { token } = useParams()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshOrganizations } = useOrganization()

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    if (!token) return

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organizations (
            name,
            logo_url
          )
        `)
        .eq('token', token)
        .single()

      if (error) throw error

      if (!data) {
        setError('Invitation not found')
        return
      }

      if ((data as any).status !== 'pending') {
        setError('This invitation is no longer valid')
        return
      }

      if (new Date((data as any).expires_at) < new Date()) {
        setError('This invitation has expired')
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', (data as any).id)
        return
      }

      setInvitation(data as any as InvitationData)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    setAccepting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be signed in to accept invitations'
        })
        navigate('/dashboard')
        return
      }

      if (user.email !== invitation.email) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'This invitation was sent to a different email address'
        })
        return
      }

      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token!
      }) as { data: { success: boolean; error?: string; organization_id?: string } | null; error: any }

      if (error) throw error

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to accept invitation')
      }

      setAccepted(true)
      await refreshOrganizations()

      toast({
        title: 'Success!',
        description: 'You have joined the organization'
      })

      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setAccepting(false)
    }
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : error ? (
                    <XCircle className="h-6 w-6 text-destructive" />
                  ) : accepted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Mail className="h-6 w-6 text-primary" />
                  )}
                </div>
              </div>
              <CardTitle className="text-center">
                {loading
                  ? 'Loading invitation...'
                  : error
                    ? 'Invalid Invitation'
                    : accepted
                      ? 'Welcome aboard!'
                      : 'You\'re invited!'}
              </CardTitle>
              <CardDescription className="text-center">
                {loading ? (
                  'Please wait...'
                ) : error ? (
                  error
                ) : accepted ? (
                  'Redirecting to dashboard...'
                ) : (
                  `Join ${invitation?.organizations.name} as a ${invitation?.role}`
                )}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : accepted ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You are now a member of {invitation?.organizations.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">
                      <strong>Organization:</strong> {invitation?.organizations.name}
                    </p>
                    <p className="text-sm">
                      <strong>Your role:</strong>{' '}
                      <span className="capitalize">{invitation?.role}</span>
                    </p>
                    <p className="text-sm">
                      <strong>Invited to:</strong> {invitation?.email}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      'Accept Invitation'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                    disabled={accepting}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthGate>
  )
}
