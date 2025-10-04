import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7)

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = {
      id: user.id,
      email: user.email!
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

export async function requireOrgAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { organizationId } = req.params
    const userId = req.user?.id

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (error || !data || !['owner', 'admin'].includes(data.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  } catch (error) {
    console.error('Org admin middleware error:', error)
    res.status(500).json({ error: 'Authorization check failed' })
  }
}
