import { Router } from 'express'
import { requireAuth, supabaseAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Get current user's profile
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single()

    if (error) throw error

    // Get user email from auth
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(req.user!.id)

    res.json({
      profile: data,
      email: user?.email
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update current user's profile
router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { first_name, last_name, avatar_url, bio } = req.body

    const updates: any = {}
    if (first_name !== undefined) updates.first_name = first_name
    if (last_name !== undefined) updates.last_name = last_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (bio !== undefined) updates.bio = bio

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user!.id)
      .select()
      .single()

    if (error) throw error

    res.json({ profile: data })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get profile by user ID (for viewing other members)
router.get('/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, bio')
      .eq('id', userId)
      .single()

    if (error) throw error

    res.json({ profile: data })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
