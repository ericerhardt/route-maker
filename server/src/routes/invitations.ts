import { Router } from 'express'
import { requireAuth, requireOrgAdmin, supabaseAdmin, AuthRequest } from '../middleware/auth'
import { generateInviteToken, getInviteExpiration } from '../utils/inviteToken'

const router = Router()

// Get invitations for an organization
router.get('/organization/:organizationId', requireAuth, requireOrgAdmin, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params

    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'expired'])
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ invitations: data })
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create invitation
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organization_id, email, role = 'member' } = req.body

    if (!organization_id || !email) {
      return res.status(400).json({ error: 'Organization ID and email are required' })
    }

    // Verify user is admin/owner
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' })
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return res.status(400).json({ error: 'Invitation already sent to this email' })
    }

    const token = generateInviteToken()
    const expiresAt = getInviteExpiration()

    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        organization_id,
        email: email.toLowerCase(),
        role,
        invited_by: req.user!.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send invitation email
    const inviteUrl = `${process.env.CLIENT_URL}/invite/${token}`
    console.log('Invitation URL:', inviteUrl)

    res.status(201).json({
      invitation,
      invite_url: inviteUrl
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get invitation by token
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params

    const { data, error } = await supabaseAdmin
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

    if (error || !data) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    if (data.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer valid' })
    }

    if (new Date(data.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', data.id)

      return res.status(400).json({ error: 'Invitation has expired' })
    }

    res.json({ invitation: data })
  } catch (error: any) {
    console.error('Error fetching invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Accept invitation
router.post('/accept/:token', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { token } = req.params

    const { data, error } = await supabaseAdmin.rpc('accept_invitation', {
      invitation_token: token
    })

    if (error) throw error

    if (!data.success) {
      return res.status(400).json({ error: data.error })
    }

    res.json({
      success: true,
      organization_id: data.organization_id
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Revoke invitation
router.delete('/:invitationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { invitationId } = req.params

    // Get invitation to check permissions
    const { data: invitation } = await supabaseAdmin
      .from('invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .single()

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    // Verify user is admin/owner
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { error } = await supabaseAdmin
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error revoking invitation:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
