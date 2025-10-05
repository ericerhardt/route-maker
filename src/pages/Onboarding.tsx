import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import AuthGate from '@/components/AuthGate'
import { Building2, User } from 'lucide-react'

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [step, setStep] = useState<'profile' | 'organization'>('profile')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasInvitation, setHasInvitation] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshOrganizations } = useOrganization()

  useEffect(() => {
    if (inviteToken) {
      setHasInvitation(true)
    }

    // Pre-fill first and last name from user metadata if available
    const loadUserMetadata = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata) {
        if (user.user_metadata.first_name) {
          setFirstName(user.user_metadata.first_name)
        }
        if (user.user_metadata.last_name) {
          setLastName(user.user_metadata.last_name)
        }
      }
    }

    loadUserMetadata()
  }, [inviteToken])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Updating profile for user:', user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        throw error
      }

      console.log('Profile updated successfully')

      // If user has an invitation, accept it instead of creating org
      if (hasInvitation && inviteToken) {
        await acceptInvitation(inviteToken)
      } else {
        setStep('organization')
      }
    } catch (error: any) {
      console.error('handleProfileSubmit error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
      }) as { data: { success: boolean; error?: string } | null; error: any }

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Failed to accept invitation')

      await refreshOrganizations()

      toast({
        title: 'Success!',
        description: 'You\'ve joined the organization'
      })

      navigate('/dashboard')
    } catch (error: any) {
      console.error('Accept invitation error:', error)
      throw error
    }
  }

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('=== STARTING ORGANIZATION CREATE ===')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('User ID:', user.id)
      console.log('User Email:', user.email)

      // Create organization slug
      const slug = orgName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')

      console.log('Creating org with:', { name: orgName.trim(), slug, created_by: user.id })

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug,
          created_by: user.id
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization insert error:', orgError)
        console.error('Error code:', orgError.code)
        console.error('Error message:', orgError.message)
        console.error('Error details:', orgError.details)
        console.error('Error hint:', orgError.hint)
        throw orgError
      }

      console.log('Organization created:', org)

      // Add user as owner
      console.log('Adding user as owner...')
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Member insert error:', memberError)
        throw memberError
      }

      console.log('User added as owner successfully')

      await refreshOrganizations()

      toast({
        title: 'Welcome!',
        description: 'Your account is set up and ready to go.'
      })

      navigate('/dashboard')
    } catch (error: any) {
      console.error('=== ORGANIZATION CREATE FAILED ===', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || JSON.stringify(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-center">
                {step === 'profile' ? (
                  <div className="rounded-full bg-primary/10 p-3">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                ) : (
                  <div className="rounded-full bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <CardTitle>
                  {step === 'profile' ? 'Welcome!' : 'Create Organization'}
                </CardTitle>
                <CardDescription>
                  {step === 'profile'
                    ? hasInvitation
                      ? "Complete your profile to join the organization"
                      : "Let's start by setting up your profile"
                    : 'Set up your organization to collaborate with your team'}
                </CardDescription>
              </div>
              {!hasInvitation && (
                <div className="flex gap-2">
                  <div className={`h-1 flex-1 rounded ${step === 'profile' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-1 flex-1 rounded ${step === 'organization' ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              )}
            </CardHeader>

            <CardContent>
              {step === 'profile' ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Continue'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      placeholder="Acme Inc."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      You can always change this later in settings
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep('profile')}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Organization'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthGate>
  )
}
