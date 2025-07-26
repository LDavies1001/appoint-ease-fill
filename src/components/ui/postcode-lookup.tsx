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
}

export const PostcodeLookup: React.FC<PostcodeLookupProps> = ({
  value,
  onChange,
  onLocationFound,
  onServiceAreaUpdate,
  placeholder = "e.g., M23 9NY",
  className,
  error
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
        
        // Build comprehensive list of service areas
        const areas = [];
        
        // Add primary locations
        if (data.result.admin_ward) areas.push(data.result.admin_ward);
        if (data.result.admin_district) areas.push(data.result.admin_district);
        
        // Extract towns from parliamentary constituency
        if (data.result.parliamentary_constituency) {
          const constituency = data.result.parliamentary_constituency;
          // Common patterns: "Town and Town2", "Town, Town2 and Town3", etc.
          const towns = constituency
            .replace(/\s+(and|&)\s+/gi, ', ')
            .split(', ')
            .map(town => town.trim())
            .filter(town => town && !town.match(/^(East|West|North|South|Central)$/i));
          areas.push(...towns);
        }
        
        // Add nearby areas based on common knowledge for M23 area
        if (data.result.outcode === 'M23') {
          const nearbyM23Areas = ['Wythenshawe', 'Baguley', 'Timperley', 'Sale', 'Brooklands', 'Northenden', 'Gatley'];
          areas.push(...nearbyM23Areas);
        }
        
        // Add region for broader coverage
        if (data.result.region) areas.push(data.result.region);
        
        // Remove duplicates and filter out empty values
        const uniqueAreas = [...new Set(areas.filter(Boolean))];
        setSelectedAreas(uniqueAreas);
        
        onLocationFound?.(data.result);
        
        // Update the input value with the selected areas
        onChange(uniqueAreas.join(', '));
          
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
    if (isValidated && newValue !== selectedAreas.join(', ')) {
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
    onChange(updatedAreas.join(', '));
  };

  const fetchNearbyTowns = async (postcode: string, radiusMiles: number) => {
    setLoadingNearbyTowns(true);
    try {
      // First get nearby postcodes within radius
      const nearbyResponse = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/nearest?radius=${radiusMiles * 1609}&limit=100`
      );
      
      if (nearbyResponse.ok) {
        const nearbyData = await nearbyResponse.json();
        const nearbyPostcodes = nearbyData.result || [];
        
        // Extract unique towns/areas from nearby postcodes
        const towns = new Set<string>();
        
        nearbyPostcodes.forEach((pc: PostcodeResult) => {
          if (pc.admin_ward) towns.add(pc.admin_ward);
          if (pc.admin_district) towns.add(pc.admin_district);
          if (pc.parliamentary_constituency) {
            // Extract town names from constituency
            const constituency = pc.parliamentary_constituency;
            const constituencyTowns = constituency
              .replace(/\s+(and|&)\s+/gi, ', ')
              .split(', ')
              .map(town => town.trim())
              .filter(town => town && !town.match(/^(East|West|North|South|Central)$/i));
            constituencyTowns.forEach(town => towns.add(town));
          }
        });
        
        const townArray = Array.from(towns).sort();
        setNearbyTowns(townArray);
        onServiceAreaUpdate?.(radiusMiles, townArray);
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
      <Label htmlFor="postcode-lookup">
        Enter your business postcode <span className="text-destructive">*</span>
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

      {/* Service Radius Selection */}
      {isValidated && selectedLocation && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-radius">Select your service radius</Label>
            <Select onValueChange={handleRadiusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose radius in miles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mile</SelectItem>
                <SelectItem value="3">3 miles</SelectItem>
                <SelectItem value="5">5 miles</SelectItem>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="15">15 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nearby Towns Preview */}
          {selectedRadius && (
            <Card className="border border-provider/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Map className="h-4 w-4 text-provider" />
                  <span>Your business will be visible to customers in these areas:</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingNearbyTowns ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Finding nearby areas...</span>
                  </div>
                ) : nearbyTowns.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {nearbyTowns.map((town, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-provider/10 text-provider text-xs"
                        >
                          {town}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No nearby areas found for this radius.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Location Areas - Removable Tags */}
      {isValidated && selectedLocation && selectedAreas.length > 0 && (
        <div className="p-3 bg-provider/5 border border-provider/20 rounded-lg">
          <div className="flex items-start space-x-2 mb-3">
            <Check className="h-4 w-4 text-provider mt-0.5" />
            <div>
              <p className="text-sm font-medium text-provider">Postcode verified!</p>
              <p className="text-xs text-muted-foreground">
                Choose your service areas by removing unwanted locations:
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-provider/10 text-provider hover:bg-provider/20 pr-1"
              >
                {area}
                <button
                  type="button"
                  onClick={() => handleRemoveArea(area)}
                  className="ml-1 hover:bg-provider/30 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {/* Manual area addition */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add custom area"
                className="h-6 text-xs px-2 min-w-24 w-auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newArea = e.currentTarget.value.trim();
                    if (!selectedAreas.includes(newArea)) {
                      const updatedAreas = [...selectedAreas, newArea];
                      setSelectedAreas(updatedAreas);
                      onChange(updatedAreas.join(', '));
                    }
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

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