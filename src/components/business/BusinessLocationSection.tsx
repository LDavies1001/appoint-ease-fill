import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, Check, X, Loader2, Home, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PostcodeResult {
  postcode: string;
  admin_district: string;
  admin_ward: string;
  parliamentary_constituency: string;
  latitude: number;
  longitude: number;
  outcode: string;
  incode: string;
}

interface BusinessLocationData {
  business_address: string;
  is_address_public: boolean;
  postcode_latitude: number | null;
  postcode_longitude: number | null;
  postcode_admin_district: string | null;
  postcode_admin_ward: string | null;
  service_radius_miles: number | null;
  nearby_towns: string[];
}

interface BusinessLocationSectionProps {
  data: BusinessLocationData;
  userId: string;
  onUpdate: (data: Partial<BusinessLocationData>) => void;
}

export const BusinessLocationSection: React.FC<BusinessLocationSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<PostcodeResult | null>(null);
  const { toast } = useToast();

  // Search for postcode suggestions
  const searchAddresses = async (query: string) => {
    // Only search if it looks like a postcode (letters and numbers)
    const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9]?[A-Z]*$/i;
    
    if (query.length < 2 || !postcodePattern.test(query.replace(/\s/g, ''))) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsLoadingAddress(true);
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.result && Array.isArray(result.result)) {
          setAddressSuggestions(result.result.slice(0, 5));
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Validate and get full address details
  const validateAddress = async (postcode: string) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.result) {
          setValidatedAddress(result.result);
          
          // Create a more detailed address string
          const fullAddress = `${result.result.admin_ward}, ${result.result.admin_district}, ${result.result.postcode}`;
          
          setEditData(prev => ({
            ...prev,
            business_address: fullAddress,
            postcode_latitude: result.result.latitude,
            postcode_longitude: result.result.longitude,
            postcode_admin_district: result.result.admin_district,
            postcode_admin_ward: result.result.admin_ward
          }));
          
          setAddressInput(fullAddress);
          setShowSuggestions(false);
          return result.result;
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
      toast({
        title: "Address validation failed",
        description: "Could not validate the address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAddress(false);
    }
    return null;
  };

  // Fetch nearby towns based on radius
  const fetchNearbyTowns = async (postcode: string, radiusMiles: number) => {
    setIsLoadingNearby(true);
    try {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/nearest?radius=${radiusMiles * 1609}&limit=100`
      );
      
      if (response.ok) {
        const result = await response.json();
        const nearbyPostcodes = result.result || [];
        
        const towns = new Set<string>();
        
        nearbyPostcodes.forEach((pc: PostcodeResult) => {
          if (pc.admin_ward) towns.add(pc.admin_ward);
          if (pc.admin_district) towns.add(pc.admin_district);
          if (pc.parliamentary_constituency) {
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
        
        setEditData(prev => ({
          ...prev,
          nearby_towns: townArray
        }));
      }
    } catch (error) {
      console.error('Error fetching nearby towns:', error);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    searchAddresses(value);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setAddressInput(suggestion);
    setShowSuggestions(false);
    await validateAddress(suggestion);
  };

  const handleRadiusChange = async (radius: string) => {
    const radiusNum = parseInt(radius);
    setEditData(prev => ({ ...prev, service_radius_miles: radiusNum }));
    
    if (validatedAddress && validatedAddress.postcode) {
      await fetchNearbyTowns(validatedAddress.postcode, radiusNum);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        business_address: editData.business_address,
        is_address_public: editData.is_address_public,
        postcode_latitude: editData.postcode_latitude,
        postcode_longitude: editData.postcode_longitude,
        postcode_admin_district: editData.postcode_admin_district,
        postcode_admin_ward: editData.postcode_admin_ward,
        service_radius_miles: editData.service_radius_miles,
        nearby_towns: editData.nearby_towns,
        postcode_verified_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('provider_details')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Business location and coverage area saved successfully ✅",
        description: "Your location settings have been updated"
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Update failed",
        description: "Could not save location settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setAddressInput(data.business_address);
    setValidatedAddress(null);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const formatAddress = (address: string) => {
    return address || 'No address provided';
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-provider" />
          </div>
          <CardTitle className="text-xl">Business Location & Coverage Area</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 hover:bg-provider/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* Smart Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address-lookup">
                Business Postcode <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter your business postcode (e.g., M23 9NY)
              </p>
              
              <div className="relative">
                <Input
                  id="address-lookup"
                  value={addressInput}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  placeholder="e.g., M23 9NY"
                  className="pr-10"
                />
                
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isLoadingAddress ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : validatedAddress ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Address Suggestions */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-provider/10 hover:text-provider focus:bg-provider/10 focus:text-provider focus:outline-none transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Confirmation Preview */}
            {validatedAddress && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Saved Address:</span>
                </div>
                <p className="text-sm text-green-700">
                  {editData.business_address}
                </p>
              </div>
            )}

            {/* Address Privacy Settings */}
            <div className="space-y-3">
              <Label>Address Visibility</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="address-public"
                    name="address-visibility"
                    checked={editData.is_address_public}
                    onChange={() => setEditData(prev => ({ ...prev, is_address_public: true }))}
                    className="w-4 h-4 text-provider"
                  />
                  <Label htmlFor="address-public" className="text-sm">
                    📍 Show full address publicly (customers can see exact location)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="address-private"
                    name="address-visibility"
                    checked={!editData.is_address_public}
                    onChange={() => setEditData(prev => ({ ...prev, is_address_public: false }))}
                    className="w-4 h-4 text-provider"
                  />
                  <Label htmlFor="address-private" className="text-sm">
                    🔒 Keep address private (recommended - share only area/town)
                  </Label>
                </div>
              </div>
            </div>

            {/* Radius Selector */}
            {validatedAddress && (
              <div className="space-y-2">
                <Label htmlFor="service-radius">Choose how far you travel for appointments</Label>
                <Select onValueChange={handleRadiusChange} value={editData.service_radius_miles?.toString()}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select travel radius" />
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
            )}

            {/* Nearby Area Autogeneration */}
            {editData.service_radius_miles && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-provider" />
                  <Label>Coverage Areas:</Label>
                </div>
                
                {isLoadingNearby ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Finding areas within {editData.service_radius_miles} miles...</span>
                  </div>
                ) : editData.nearby_towns.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {editData.nearby_towns.map((town, index) => (
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
                  <p className="text-sm text-muted-foreground">
                    Select a radius to see coverage areas
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !validatedAddress}
                className="flex-1"
                size="sm"
                variant="provider"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Location & Coverage
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Address Display */}
            <div className="flex items-start space-x-3">
              <Home className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="font-medium">
                  {formatAddress(data.business_address)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.is_address_public 
                    ? "📍 Public address (visible to customers)" 
                    : "🔒 Private address (area only visible to customers)"
                  }
                </p>
              </div>
            </div>

            {/* Service Coverage */}
            {data.service_radius_miles && data.nearby_towns.length > 0 && (
              <div className="flex items-start space-x-3">
                <Navigation className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="font-medium">
                    Service Coverage: {data.service_radius_miles} mile radius
                  </p>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {data.nearby_towns.slice(0, 6).map((town, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-muted/50 text-muted-foreground text-xs"
                        >
                          {town}
                        </Badge>
                      ))}
                      {data.nearby_towns.length > 6 && (
                        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-xs">
                          +{data.nearby_towns.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};