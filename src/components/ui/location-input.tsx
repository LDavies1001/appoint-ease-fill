import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface LocationSuggestion {
  display_name: string;
  address: any;
  lat: string;
  lon: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  placeholder = "Enter location",
  className,
  value,
  onChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try multiple zoom levels to get the most specific location
          let location = null;
          const zoomLevels = [18, 16, 14, 12]; // Start with highest detail
          
          for (const zoom of zoomLevels) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=${zoom}&addressdetails=1`
              );
              
              if (!response.ok) continue;
              
              const data = await response.json();
              const address = data.address || {};
              
              // Extract the most specific locality from the address
              location = address.suburb ||           // Prioritize suburb (like Baguley, Farnworth)
                        address.neighbourhood ||    // Neighbourhood names
                        address.village ||          // Village names 
                        address.hamlet ||           // Small settlements
                        address.town ||             // Town names
                        address.district ||         // District names
                        address.borough ||          // Borough names
                        address.city_district ||    // City district
                        address.residential ||      // Residential area
                        null;
              
              // If we found a specific locality, use it
              if (location && location !== 'Manchester' && location !== 'Greater Manchester') {
                console.log(`Found specific location: ${location} at zoom ${zoom}`);
                break;
              }
            } catch (err) {
              console.error(`Failed at zoom ${zoom}:`, err);
              continue;
            }
          }
          
          // If no specific locality found, fall back to city but warn user
          if (!location) {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            const data = await response.json();
            const address = data.address || {};
            location = address.city || address.town || 'Unknown location';
            console.log('Falling back to city level:', location);
          }
          
          setInputValue(location);
          onChange?.(location);
          
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Failed to get location details. Please enter your location manually.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out.');
            break;
          default:
            alert('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Search for locations based on input
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Search specifically in UK for better postcode/locality results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        const filteredSuggestions = data.map((item: any) => ({
          display_name: item.display_name,
          address: item.address || {},
          lat: item.lat,
          lon: item.lon
        }));
        
        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim()) {
        searchLocations(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    // Extract the most specific locality from the suggestion
    const address = suggestion.address;
    const location = address.suburb ||
                    address.neighbourhood ||
                    address.village ||
                    address.hamlet ||
                    address.town ||
                    address.district ||
                    address.borough ||
                    address.city_district ||
                    address.city ||
                    suggestion.display_name?.split(',')[0] ||
                    'Unknown location';
    
    setInputValue(location);
    onChange?.(location);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className={cn("pl-10 pr-20", className)}
      />
      
      {/* Search loading indicator */}
      {searchLoading && (
        <div className="absolute right-12 top-3 h-4 w-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Current location button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-primary/10"
        onClick={getCurrentLocation}
        disabled={isLoading}
        title="Use my current location"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 text-primary" />
        )}
      </Button>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const address = suggestion.address;
            const locality = address.suburb ||
                           address.neighbourhood ||
                           address.village ||
                           address.hamlet ||
                           address.town ||
                           address.district ||
                           address.borough ||
                           address.city_district ||
                           address.city ||
                           suggestion.display_name?.split(',')[0];
            
            const fullAddress = suggestion.display_name;
            
            return (
              <div
                key={index}
                className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium text-foreground">{locality}</div>
                <div className="text-sm text-muted-foreground truncate">{fullAddress}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};