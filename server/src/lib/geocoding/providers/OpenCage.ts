import type { IGeocoder } from '../index'

interface OpenCageResult {
  results: Array<{
    geometry: {
      lat: number
      lng: number
    }
  }>
  status: {
    code: number
    message: string
  }
}

export class OpenCageGeocoder implements IGeocoder {
  private apiKey: string
  private baseUrl = 'https://api.opencagedata.com/geocode/v1/json'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        q: address,
        key: this.apiKey,
        limit: '1',
        no_annotations: '1',
      })

      const response = await fetch(`${this.baseUrl}?${params}`)

      if (!response.ok) {
        console.error(`OpenCage API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data: OpenCageResult = await response.json()

      if (data.status.code !== 200) {
        console.error(`OpenCage error: ${data.status.message}`)
        return null
      }

      if (data.results.length === 0) {
        console.warn(`No results found for address: ${address}`)
        return null
      }

      const { lat, lng } = data.results[0].geometry
      return { lat, lng }
    } catch (error) {
      console.error('OpenCage geocoding error:', error)
      return null
    }
  }
}
