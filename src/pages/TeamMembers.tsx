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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, MoreVertical, Trash2, Shield, Mail, Copy, Check, RefreshCw } from 'lucide-react'
import type { OrganizationRole } from '@/lib/supabaseClient'

interface Member {
  id: string
  user_id: string
  email: string
  role: OrganizationRole
  created_at: string
  profile: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

interface Invitation {
  id: string
  email: string
  role: OrganizationRole
  status: string
  created_at: string
  expires_at: string
  token: string
}

export default function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member')
  const [inviting, setInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [resendingInvite, setResendingInvite] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      fetchMembers()
      fetchInvitations()
      setCurrentUserRole(currentOrganization.role || null)
    }
  }, [currentOrganization])

  const fetchMembers = async () => {
    if (!currentOrganization) return

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('organization_id', currentOrganization.id)

      if (error) throw error

      // Get user emails - we'll use a database function to get emails
      const { data: membersData, error: emailError } = await supabase
        .rpc('get_organization_members_with_emails', {
          org_id: currentOrganization.id
        })

      if (emailError) {
        console.error('Error fetching member emails:', emailError)
        // Fallback: just show members without emails
        const membersWithoutEmail = (data || []).map(member => ({
          ...member,
          email: 'Unknown',
          profile: member.profiles
        }))
        setMembers(membersWithoutEmail)
      } else {
        setMembers(membersData || [])
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    if (!currentOrganization) return

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('status', ['pending'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error: any) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization) return

    setInviting(true)

    try {
      // Check if there's already a pending invitation for this email
      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('organization_id', currentOrganization.id)
        .eq('email', inviteEmail.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle()

      if (existingInvite) {
        // Resend the existing invitation instead
        await handleResendInvitation(existingInvite.id)
        setInviteEmail('')
        setInviteRole('member')
        setInviteOpen(false)
        return
      }

      // Generate token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: currentOrganization.id,
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send the invitation email via edge function
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Sending invite email for token:', data.token)
          console.log('Invitation data:', data)

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                type: 'INSERT',
                table: 'invitations',
                record: data
              })
            }
          )

          const result = await response.json()
          console.log('Email send response:', result)
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the whole operation if email fails
      }

      toast({
        title: 'Invitation sent',
        description: `Invited ${inviteEmail} as ${inviteRole}`
      })

      setInviteEmail('')
      setInviteRole('member')
      setInviteOpen(false)
      fetchInvitations()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Member removed from organization'
      })

      fetchMembers()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Member role updated'
      })

      fetchMembers()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Invitation revoked'
      })

      fetchInvitations()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
    toast({
      title: 'Copied!',
      description: 'Invitation link copied to clipboard'
    })
  }

  const handleResendInvitation = async (invitationId: string) => {
    setResendingInvite(invitationId)

    try {
      const invitation = invitations.find(inv => inv.id === invitationId)
      if (!invitation) throw new Error('Invitation not found')

      // Call the edge function directly to resend the email
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'invitations',
            record: invitation
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: 'Success',
        description: `Invitation email resent to ${invitation.email}`
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setResendingInvite(null)
    }
  }

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Team Members</h1>
                <p className="text-muted-foreground">
                  Manage your team for {currentOrganization.name}
                </p>
              </div>
              {isAdmin && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="teammate@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={(value) => setInviteRole(value as OrganizationRole)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {currentUserRole === 'owner' && (
                                <SelectItem value="owner">Owner</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={inviting}>
                          {inviting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid gap-6">
              {/* Current Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Members ({members.length})</CardTitle>
                  <CardDescription>Active members of your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No members yet</p>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-medium text-primary">
                                {member.profile?.first_name?.[0] || member.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {member.profile?.first_name} {member.profile?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            {isAdmin && member.role !== 'owner' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(member.id, 'member')}
                                  >
                                    Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(member.id, 'admin')}
                                  >
                                    Admin
                                  </DropdownMenuItem>
                                  {currentUserRole === 'owner' && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateRole(member.id, 'owner')}
                                    >
                                      Owner
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              {isAdmin && invitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
                    <CardDescription>Invitations waiting to be accepted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <Mail className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{invitation.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Invited {new Date(invitation.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{invitation.role}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={resendingInvite === invitation.id}
                              title="Resend invitation email"
                            >
                              <RefreshCw className={`h-4 w-4 ${resendingInvite === invitation.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(invitation.token)}
                              title="Copy invitation link"
                            >
                              {copiedToken === invitation.token ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              title="Revoke invitation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
