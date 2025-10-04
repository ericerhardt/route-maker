import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/supabaseClient'

type Organization = Database['public']['Tables']['organizations']['Row'] & {
  role?: 'owner' | 'admin' | 'member'
}

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  setCurrentOrganization: (org: Organization | null) => void
  loading: boolean
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrganizations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setOrganizations([])
        setCurrentOrganization(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_user_organizations', {
        user_uuid: session.user.id
      })

      if (error) throw error

      setOrganizations(data || [])

      // Set first org as current if none selected
      if (!currentOrganization && data && data.length > 0) {
        const savedOrgId = localStorage.getItem('currentOrganizationId')
        const org = savedOrgId
          ? data.find((o: Organization) => o.id === savedOrgId) || data[0]
          : data[0]
        setCurrentOrganization(org)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchOrganizations()
      } else if (event === 'SIGNED_OUT') {
        setOrganizations([])
        setCurrentOrganization(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id)
    }
  }, [currentOrganization])

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        loading,
        refreshOrganizations: fetchOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
