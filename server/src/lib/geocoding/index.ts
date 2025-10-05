export interface IGeocoder {
  geocode(address: string): Promise<{ lat: number; lng: number } | null>
}

export interface GeocodingConfig {
  provider: 'opencage' | 'google'
  apiKey: string
}

export async function createGeocoder(config: GeocodingConfig): Promise<IGeocoder> {
  const { provider, apiKey } = config

  switch (provider) {
    case 'opencage': {
      const { OpenCageGeocoder } = await import('./providers/OpenCage')
      return new OpenCageGeocoder(apiKey)
    }
    case 'google': {
      const { GoogleGeocoder } = await import('./providers/Google')
      return new GoogleGeocoder(apiKey)
    }
    default:
      throw new Error(`Unsupported geocoding provider: ${provider}`)
  }
}

// Factory function to get geocoder from environment
export async function getGeocoder(): Promise<IGeocoder> {
  const provider = (process.env.GEOCODING_PROVIDER || 'opencage') as 'opencage' | 'google'
  const apiKey = process.env.GEOCODING_API_KEY

  if (!apiKey) {
    throw new Error('GEOCODING_API_KEY environment variable is required')
  }

  return createGeocoder({ provider, apiKey })
}
