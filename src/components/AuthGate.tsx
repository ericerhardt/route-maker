import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
  children: ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)

      // Check if user needs onboarding
      if (session) {
        checkOnboarding(session.user.id)
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkOnboarding(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Check if user's email is confirmed
      if (user && !user.email_confirmed_at) {
        console.log('Email not confirmed yet')
        return
      }

      // Check if user has completed profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single()

      // Check if user has/belongs to an organization
      const { data: orgs } = await supabase.rpc('get_user_organizations', {
        user_uuid: userId
      }) as { data: any[] | null; error: any }

      // Check for pending invitations for this user's email
      const { data: pendingInvites } = await supabase
        .from('invitations')
        .select('id, token, organization_id')
        .eq('email', user?.email)
        .eq('status', 'pending')
        .limit(1)

      if (!profile?.first_name || !orgs || orgs.length === 0) {
        // If user has pending invite, include token in navigation
        if (pendingInvites && pendingInvites.length > 0) {
          navigate(`/onboarding?invite=${pendingInvites[0].token}`)
        } else {
          navigate('/onboarding')
        }
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })
        if (error) throw error
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link. Please verify your email to continue.'
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        toast({
          title: 'Signed in',
          description: 'Welcome back!'
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = () => {
    navigate('/reset-password')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Enter your credentials to access your account'
                : 'Create a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
              {mode === 'signin' && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Sign Up'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
