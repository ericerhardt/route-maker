import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  const request = async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const get = <T,>(endpoint: string) => request<T>(endpoint, { method: 'GET' })

  const post = <T,>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })

  const patch = <T,>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })

  const del = <T,>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' })

  return {
    loading,
    error,
    get,
    post,
    patch,
    delete: del
  }
}
