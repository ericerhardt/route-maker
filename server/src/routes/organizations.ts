import { Router } from 'express'
import { requireAuth, requireOrgAdmin, supabaseAdmin, AuthRequest } from '../middleware/auth'
import { slugify, generateUniqueSlug } from '../utils/slugify'

const router = Router()

// Get all organizations for current user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_user_organizations', {
      user_uuid: req.user!.id
    })

    if (error) throw error

    res.json({ organizations: data })
  } catch (error: any) {
    console.error('Error fetching organizations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single organization
router.get('/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params

    // Check if user is member
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) throw error

    res.json({ organization: data, role: membership.role })
  } catch (error: any) {
    console.error('Error fetching organization:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create organization
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Organization name is required' })
    }

    // Generate unique slug
    const baseSlug = slugify(name)
    const { data: existingOrgs } = await supabaseAdmin
      .from('organizations')
      .select('slug')

    const existingSlugs = existingOrgs?.map(o => o.slug) || []
    const slug = generateUniqueSlug(baseSlug, existingSlugs)

    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        created_by: req.user!.id
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Add creator as owner
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: req.user!.id,
        role: 'owner'
      })

    if (memberError) throw memberError

    res.status(201).json({ organization: org })
  } catch (error: any) {
    console.error('Error creating organization:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update organization
router.patch('/:organizationId', requireAuth, requireOrgAdmin, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params
    const { name, logo_url, settings } = req.body

    const updates: any = {}
    if (name) updates.name = name.trim()
    if (logo_url !== undefined) updates.logo_url = logo_url
    if (settings) updates.settings = settings

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error

    res.json({ organization: data })
  } catch (error: any) {
    console.error('Error updating organization:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete organization
router.delete('/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params

    // Check if user is owner
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete organizations' })
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting organization:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get organization members
router.get('/:organizationId/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params

    // Verify user is member
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        id,
        role,
        created_at,
        user_id,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)

    if (error) throw error

    // Get user emails from auth.users
    const userIds = data.map(m => m.user_id)
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()

    const members = data.map(member => {
      const user = users.users.find(u => u.id === member.user_id)
      return {
        id: member.id,
        user_id: member.user_id,
        email: user?.email,
        role: member.role,
        created_at: member.created_at,
        profile: member.profiles
      }
    })

    res.json({ members })
  } catch (error: any) {
    console.error('Error fetching members:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update member role
router.patch('/:organizationId/members/:memberId', requireAuth, requireOrgAdmin, async (req: AuthRequest, res) => {
  try {
    const { organizationId, memberId } = req.params
    const { role } = req.body

    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error

    res.json({ member: data })
  } catch (error: any) {
    console.error('Error updating member:', error)
    res.status(500).json({ error: error.message })
  }
})

// Remove member
router.delete('/:organizationId/members/:memberId', requireAuth, requireOrgAdmin, async (req: AuthRequest, res) => {
  try {
    const { organizationId, memberId } = req.params

    const { error } = await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error removing member:', error)
    res.status(500).json({ error: error.message })
  }
})

// Leave organization
router.post('/:organizationId/leave', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params

    // Check if user is the only owner
    const { data: owners } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')

    if (owners && owners.length === 1) {
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('user_id')
        .eq('id', owners[0].id)
        .single()

      if (member?.user_id === req.user!.id) {
        return res.status(400).json({
          error: 'Cannot leave organization as the only owner. Transfer ownership first.'
        })
      }
    }

    const { error } = await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', req.user!.id)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error leaving organization:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
