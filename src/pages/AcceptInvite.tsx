import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Mail, CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  organization_id: string
  organizations: {
    name: string
    logo_url: string | null
  }
}

export default function AcceptInvite() {
  const { token } = useParams()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshOrganizations } = useOrganization()

  useEffect(() => {
    if (token) {
      fetchInvitation()
      checkAuthStatus()
    }
  }, [token])

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  const fetchInvitation = async () => {
    if (!token) return

    try {
      console.log('Fetching invitation with token:', token)

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organizations!inner (
            name,
            logo_url
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle()

      console.log('Invitation query result:', { data, error })

      if (error) {
        console.error('Invitation fetch error:', error)
        throw error
      }

      if (!data) {
        // Try to find ANY invitation with this token to debug
        const { data: anyInvite } = await supabase
          .from('invitations')
          .select('id, email, status, token, organization_id')
          .eq('token', token)
          .maybeSingle()

        console.log('Debug - any invitation with this token:', anyInvite)

        if (anyInvite) {
          setError(`This invitation has status: ${anyInvite.status}. It may have already been ${anyInvite.status}.`)
        } else {
          setError('Invitation not found')
        }
        return
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', data.id)
        return
      }

      // Ensure organizations data exists
      if (!data.organizations) {
        console.error('Organization data missing from invitation:', data)
        setError('Invalid invitation - organization not found')
        return
      }

      const inviteData = data as any as InvitationData
      setInvitation(inviteData)
      setEmail(inviteData.email) // Pre-fill email
    } catch (error: any) {
      console.error('Error fetching invitation:', error)
      setError(error.message || 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    setProcessing(true)

    try {
      // Step 1: Sign up the user (will require email confirmation)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            invite_token: token // Store invite token for later
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create user')

      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link. After confirming, you\'ll be added to the organization.'
      })

      setProcessing(false)

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
      setProcessing(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    setProcessing(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (!data.user) throw new Error('Failed to sign in')

      if (data.user.email !== invitation.email) {
        throw new Error('This invitation was sent to a different email address')
      }

      // Accept the invitation
      await acceptInvitation()

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
      setProcessing(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitation || !token) return

    try {
      console.log('Accepting invitation with token:', token)

      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
      }) as { data: { success: boolean; error?: string; organization_id?: string } | null; error: any }

      console.log('Accept invitation result:', { data, error })

      if (error) {
        console.error('Accept invitation RPC error:', error)
        throw error
      }

      if (!data?.success) {
        console.error('Accept invitation failed:', data?.error)
        throw new Error(data?.error || 'Failed to accept invitation')
      }

      console.log('Invitation accepted successfully!')
      setAccepted(true)
      await refreshOrganizations()

      toast({
        title: 'Success!',
        description: `You've joined ${invitation.organizations.name}`
      })

      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('acceptInvitation error:', error)
      throw error
    }
  }

  const handleAcceptExisting = async () => {
    setProcessing(true)
    try {
      await acceptInvitation()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
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
                <div className="rounded-full bg-destructive/10 p-3">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-center">Invalid Invitation</CardTitle>
              <CardDescription className="text-center">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (accepted) {
    return (
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
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-center">Welcome aboard!</CardTitle>
              <CardDescription className="text-center">
                You're now a member of {invitation.organizations.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // If user is already authenticated, just show accept button
  if (isAuthenticated) {
    return (
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
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">Join Organization</CardTitle>
              <CardDescription className="text-center">
                You've been invited to join {invitation.organizations.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm">
                  <strong>Organization:</strong> {invitation.organizations.name}
                </p>
                <p className="text-sm">
                  <strong>Your role:</strong>{' '}
                  <span className="capitalize">{invitation.role}</span>
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {invitation.email}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleAcceptExisting}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/dashboard')}
                disabled={processing}
              >
                Decline
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Show auth form for non-authenticated users
  return (
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
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">
              You've been invited to {invitation.organizations.name}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'signup'
                ? 'Create your account to join the organization'
                : 'Sign in to accept the invitation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Invitation sent to this email
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : mode === 'signup' ? (
                  'Create Account & Join'
                ) : (
                  'Sign In & Join'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                disabled={processing}
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
