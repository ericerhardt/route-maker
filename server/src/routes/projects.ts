import { Router } from 'express'
import { requireAuth, supabaseAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Get all projects for an organization
router.get('/organization/:organizationId', requireAuth, async (req: AuthRequest, res) => {
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
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ projects: data })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single project
router.get('/:projectId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error

    // Verify user is member of organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to view this project' })
    }

    res.json({ project })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create project
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organization_id, name, description } = req.body

    if (!organization_id || !name) {
      return res.status(400).json({ error: 'Organization ID and name are required' })
    }

    // Verify user is member
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        organization_id,
        name: name.trim(),
        description: description?.trim(),
        created_by: req.user!.id
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ project: data })
  } catch (error: any) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update project
router.patch('/:projectId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params
    const { name, description } = req.body

    // Get project to verify organization
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user is member
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to update this project' })
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim()

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error

    res.json({ project: data })
  } catch (error: any) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete project
router.delete('/:projectId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params

    // Get project to verify organization
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user is admin/owner
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
