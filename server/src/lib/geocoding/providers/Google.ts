import type { IGeocoder } from '../index'

interface GoogleGeocodingResult {
  results: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
  status: string
  error_message?: string
}

export class GoogleGeocoder implements IGeocoder {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
      })

      const response = await fetch(`${this.baseUrl}?${params}`)

      if (!response.ok) {
        console.error(`Google Geocoding API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data: GoogleGeocodingResult = await response.json()

      if (data.status !== 'OK') {
        console.error(`Google Geocoding error: ${data.status} - ${data.error_message || 'Unknown error'}`)
        return null
      }

      if (data.results.length === 0) {
        console.warn(`No results found for address: ${address}`)
        return null
      }

      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    } catch (error) {
      console.error('Google Geocoding error:', error)
      return null
    }
  }
}
