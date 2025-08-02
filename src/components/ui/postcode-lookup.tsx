import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Check, AlertCircle, Loader2, X, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostcodeResult {
  postcode: string;
  country: string;
  region: string;
  admin_district: string;
  admin_ward: string;
  parish: string;
  parliamentary_constituency: string;
  ccg: string;
  ced: string;
  nuts: string;
  lsoa: string;
  msoa: string;
  latitude: number;
  longitude: number;
  eastings: number;
  northings: number;
  outcode: string;
  incode: string;
}

interface PostcodeLookupProps {
  value: string;
  onChange: (postcode: string, locationData?: PostcodeResult) => void;
  onLocationFound?: (locationData: PostcodeResult) => void;
  onServiceAreaUpdate?: (radius: number, nearbyTowns: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  mode?: 'address' | 'service-area'; // New prop to control behavior
}

export const PostcodeLookup: React.FC<PostcodeLookupProps> = ({
  value,
  onChange,
  onLocationFound,
  onServiceAreaUpdate,
  placeholder = "e.g., M23 9NY",
  className,
  error,
  mode = 'service-area' // Default to existing behavior
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PostcodeResult | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [nearbyTowns, setNearbyTowns] = useState<string[]>([]);
  const [loadingNearbyTowns, setLoadingNearbyTowns] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && value.length >= 2 && !isValidated) {
        searchPostcodes(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, isValidated]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPostcodes = async (query: string) => {
    if (query.length < 2) return;
    
    setIsLoading(true);
    try {
      // Use autocomplete endpoint for suggestions
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && Array.isArray(data.result)) {
          setSuggestions(data.result.slice(0, 5)); // Limit to 5 suggestions
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error fetching postcode suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndGetPostcodeDetails = async (postcode: string) => {
    setIsLoading(true);
    setValidationError(null);
    
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setSelectedLocation(data.result);
          setIsValidated(true);
          setValidationError(null);
          
          // Clear previous areas and radius - user must select radius first
          setSelectedAreas([]);
          setSelectedRadius(null);
          setNearbyTowns([]);
          
          onLocationFound?.(data.result);
          
          // Don't set service area yet - wait for radius selection
          onChange(postcode, data.result);
          
          return data.result;
        }
      } else if (response.status === 404) {
        setValidationError("Postcode not found. Please check and try again.");
        setIsValidated(false);
        setSelectedLocation(null);
      } else {
        throw new Error('Failed to validate postcode');
      }
    } catch (error) {
      console.error('Error validating postcode:', error);
      setValidationError("Unable to validate postcode. Please try again.");
      setIsValidated(false);
      setSelectedLocation(null);
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    
    // Reset validation when user types
    if (isValidated && newValue !== (mode === 'address' ? selectedLocation?.postcode : selectedAreas.join(', '))) {
      setIsValidated(false);
      setSelectedLocation(null);
      setSelectedAreas([]);
      setValidationError(null);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Validate the selected suggestion
    const locationData = await validateAndGetPostcodeDetails(suggestion);
    if (locationData) {
      onChange(suggestion, locationData);
    }
  };

  const handleInputBlur = async () => {
    // Small delay to allow suggestion clicks
    setTimeout(async () => {
      if (value && !isValidated && !showSuggestions) {
        await validateAndGetPostcodeDetails(value);
      }
    }, 150);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !isValidated) {
      setShowSuggestions(true);
    }
  };

  const handleRemoveArea = (areaToRemove: string) => {
    const updatedAreas = selectedAreas.filter(area => area !== areaToRemove);
    setSelectedAreas(updatedAreas);
    // Only update input with service areas if in service-area mode
    if (mode === 'service-area') {
      onChange(updatedAreas.join(', '));
    }
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  const fetchNearbyTowns = async (postcode: string, radiusMiles: number) => {
    setLoadingNearbyTowns(true);
    try {
      // Get a larger radius to ensure we capture all potential areas
      const searchRadiusMeters = radiusMiles * 1609 * 2; // Double the radius for initial search
      
      const nearbyResponse = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/nearest?radius=${searchRadiusMeters}&limit=200`
      );
      
      if (nearbyResponse.ok) {
        const nearbyData = await nearbyResponse.json();
        const nearbyPostcodes = nearbyData.result || [];
        
        // Filter postcodes by actual Haversine distance
        const baseLocation = selectedLocation;
        if (!baseLocation) return;
        
        const areasWithDistance: {area: string, distance: number}[] = [];
        
        nearbyPostcodes.forEach((pc: PostcodeResult) => {
          const distance = calculateDistance(
            baseLocation.latitude,
            baseLocation.longitude,
            pc.latitude,
            pc.longitude
          );
          
          // Only include areas within the selected radius
          if (distance <= radiusMiles) {
            // Add admin ward with distance
            if (pc.admin_ward && !areasWithDistance.some(item => item.area === pc.admin_ward)) {
              areasWithDistance.push({area: pc.admin_ward, distance});
            }
            
            // Add admin district with distance
            if (pc.admin_district && !areasWithDistance.some(item => item.area === pc.admin_district)) {
              areasWithDistance.push({area: pc.admin_district, distance});
            }
            
            // Extract and add towns from parliamentary constituency
            if (pc.parliamentary_constituency) {
              const constituency = pc.parliamentary_constituency;
              const constituencyTowns = constituency
                .replace(/\s+(and|&)\s+/gi, ', ')
                .split(', ')
                .map(town => town.trim())
                .filter(town => town && !town.match(/^(East|West|North|South|Central)$/i));
              
              constituencyTowns.forEach(town => {
                if (!areasWithDistance.some(item => item.area === town)) {
                  areasWithDistance.push({area: town, distance});
                }
              });
            }
          }
        });
        
        // Sort areas by distance and extract names
        const sortedAreas = areasWithDistance
          .sort((a, b) => a.distance - b.distance) // Sort by distance
          .map(item => item.area); // Extract area names
        
        setNearbyTowns(sortedAreas);
        setSelectedAreas(sortedAreas);
        
        // Only update the input field with service areas if in service-area mode
        if (mode === 'service-area') {
          onChange(sortedAreas.join(', '));
        }
        
        // Notify parent component
        onServiceAreaUpdate?.(radiusMiles, sortedAreas);
      }
    } catch (error) {
      console.error('Error fetching nearby towns:', error);
    } finally {
      setLoadingNearbyTowns(false);
    }
  };

  const handleRadiusChange = (radius: string) => {
    const radiusNum = parseInt(radius);
    setSelectedRadius(radiusNum);
    
    if (selectedLocation && selectedLocation.postcode) {
      fetchNearbyTowns(selectedLocation.postcode, radiusNum);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="postcode-lookup" className="text-green-800 font-medium">
        Business Postcode <span className="text-destructive">*</span>
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="postcode-lookup"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={cn(
              "pr-10",
              error || validationError ? 'border-destructive' : '',
              isValidated ? 'border-green-500 bg-green-50/50' : ''
            )}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isValidated ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : validationError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-provider/10 hover:text-provider focus:bg-provider/10 focus:text-provider focus:outline-none transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Start typing your postcode to search your location
      </p>


      {/* Error Message */}
      {(error || validationError) && (
        <div className="flex items-start space-x-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error || validationError}</p>
        </div>
      )}
    </div>
  );
};