import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressComponents {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface AddressResult {
  description: string
  formattedAddress: string
  components?: AddressComponents
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (address: AddressResult) => void
  placeholder?: string
  disabled?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('geocode-autocomplete', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Pass query as URL parameter
      })

      // For now, make direct HTTP call since invoke doesn't support GET params well
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(
        `${supabaseUrl}/functions/v1/geocode-autocomplete?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      )

      const result = await response.json()

      if (result.results) {
        console.log('Autocomplete results:', result.results)
        setSuggestions(result.results)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)

    // Debounce the search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 300)
  }

  const handleSelect = async (suggestion: AddressResult) => {
    console.log('Selected address:', suggestion)
    setShowSuggestions(false)
    setSuggestions([])

    // If Google place with placeId, fetch details to get components
    if (suggestion.placeId) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const response = await fetch(
          `${supabaseUrl}/functions/v1/geocode-place-details?place_id=${encodeURIComponent(suggestion.placeId)}`,
          {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        )
        const data = await response.json()

        if (data.components) {
          // Update the suggestion with components
          const enhancedSuggestion = {
            ...suggestion,
            formattedAddress: data.components.street || suggestion.description,
            components: data.components,
          }
          onChange(enhancedSuggestion.formattedAddress)
          onSelect?.(enhancedSuggestion)
        } else {
          onChange(suggestion.formattedAddress)
          onSelect?.(suggestion)
        }
      } catch (error) {
        console.error('Error fetching place details:', error)
        onChange(suggestion.formattedAddress)
        onSelect?.(suggestion)
      }
    } else {
      // OpenCage results already have components
      onChange(suggestion.formattedAddress)
      onSelect?.(suggestion)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span>{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
