import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Locate, CheckCircle, AlertCircle, Eye, EyeOff, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface AddressData {
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  county: string;
  postcode: string;
  country: string;
  is_public: boolean; // Whether customers can see the full address
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  className?: string;
}

const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'Durham',
  'East Riding of Yorkshire', 'East Sussex', 'Essex', 'Gloucestershire',
  'Greater London', 'Greater Manchester', 'Hampshire', 'Herefordshire',
  'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire',
  'Lincolnshire', 'Merseyside', 'Norfolk', 'North Yorkshire', 'Northamptonshire',
  'Northumberland', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire',
  'Somerset', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey',
  'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex', 'West Yorkshire',
  'Wiltshire', 'Worcestershire'
];

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' }
];

export const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  errors = {},
  className
}) => {
  const [detecting, setDetecting] = useState(false);
  const [lookingUpPostcode, setLookingUpPostcode] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<any[]>([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const { toast } = useToast();

  // Function to lookup all addresses for a postcode
  const lookupPostcodeAddresses = async (postcode: string) => {
    if (!postcode || postcode.length < 5) return;
    
    setLookingUpPostcode(true);
    setAvailableAddresses([]);
    setShowAddressSelector(false);
    
    try {
      // Clean postcode (remove spaces, uppercase)
      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
      
      // Search for all addresses in this postcode area using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPostcode}&countrycodes=gb&addressdetails=1&limit=50`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length > 0) {
          // Group addresses by house number and remove duplicates
          const addressMap = new Map();
          
          data.forEach((item: any) => {
            const address = item.address;
            const houseNumber = address.house_number;
            const streetName = address.road || address.street || '';
            
            if (houseNumber && streetName) {
              const key = `${houseNumber}-${streetName}`;
              if (!addressMap.has(key)) {
                addressMap.set(key, {
                  house_number: houseNumber,
                  street: streetName,
                  suburb: address.suburb || address.neighbourhood || '',
                  city: address.city || address.town || 'Manchester',
                  county: address.county || address.state_district || 'Greater Manchester',
                  postcode: address.postcode || cleanPostcode,
                  country: address.country || 'United Kingdom',
                  displayName: `${houseNumber} ${streetName}`
                });
              }
            }
          });
          
          // Convert to array and sort by house number
          const addresses = Array.from(addressMap.values()).sort((a, b) => {
            const aNum = parseInt(a.house_number) || 999;
            const bNum = parseInt(b.house_number) || 999;
            return aNum - bNum;
          });
          
          setAvailableAddresses(addresses);
          setShowAddressSelector(addresses.length > 0);
          
          // If no specific addresses found, try general postcode lookup
          if (addresses.length === 0) {
            await fallbackGeneralLookup(cleanPostcode);
          }
        } else {
          await fallbackGeneralLookup(cleanPostcode);
        }
      }
    } catch (error) {
      console.error('Postcode lookup failed:', error);
      await fallbackGeneralLookup(postcode.replace(/\s/g, '').toUpperCase());
    } finally {
      setLookingUpPostcode(false);
    }
  };

  // Fallback to general postcode info when specific addresses not found
  const fallbackGeneralLookup = async (cleanPostcode: string) => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      
      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        if (result) {
          // Get the local area name
          const localArea = result.parish || result.admin_ward || result.ward || '';
          const city = result.admin_district || 'Manchester';
          
          let townCity = '';
          if (localArea && localArea !== 'Unparished Area' && localArea !== city) {
            townCity = `${localArea}, ${city}`;
          } else {
            townCity = city;
          }
          
          // Update fields with general area info, leave house number and street empty
          const updatedAddress: AddressData = {
            address_line_1: '',
            address_line_2: '',
            town_city: townCity,
            county: result.admin_county || 'Greater Manchester',
            postcode: result.postcode,
            country: result.country || 'United Kingdom',
            is_public: value.is_public
          };
          
          onChange(updatedAddress);
        }
      }
    } catch (error) {
      console.error('Fallback postcode lookup failed:', error);
    }
  };

  // Handle address selection
  const selectAddress = (selectedAddress: any) => {
    const localArea = selectedAddress.suburb;
    const city = selectedAddress.city;
    
    let townCity = '';
    if (localArea && localArea !== 'Unparished Area' && localArea !== city) {
      townCity = `${localArea}, ${city}`;
    } else {
      townCity = city;
    }
    
    const fullAddress: AddressData = {
      address_line_1: selectedAddress.house_number,
      address_line_2: selectedAddress.street,
      town_city: townCity,
      county: selectedAddress.county,
      postcode: selectedAddress.postcode,
      country: selectedAddress.country,
      is_public: value.is_public
    };
    
    onChange(fullAddress);
    setShowAddressSelector(false);
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string | boolean) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  const validateUKPostcode = (postcode: string): boolean => {
    // UK postcode patterns: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.replace(/\s/g, ''));
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      return; // Fail silently, user can enter manually
    }

    setDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try multiple approaches for the most accurate address
          let bestAddress = null;
          
          // Strategy 1: High precision with multiple zoom levels
          const zoomLevels = [20, 19, 18, 17, 16]; // Start with highest precision
          
          for (const zoom of zoomLevels) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=${zoom}&accept-language=en`
              );
              
              if (!response.ok) continue;
              
              const data = await response.json();
              const address = data.address || {};
              
              // Check if this gives us a more specific postcode
              if (address.postcode && address.postcode !== 'M23 0GB') {
                bestAddress = address;
                console.log(`Found specific address at zoom ${zoom}:`, address.postcode);
                break;
              }
            } catch (err) {
              console.error(`Failed at zoom ${zoom}:`, err);
              continue;
            }
          }
          
          // Strategy 2: Try nearby search if reverse geocoding wasn't precise enough
          if (!bestAddress || bestAddress.postcode === 'M23 0GB') {
            try {
              const searchResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&limit=5&bounded=1&viewbox=${longitude-0.001},${latitude+0.001},${longitude+0.001},${latitude-0.001}`
              );
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                // Find the result with the most specific postcode
                for (const result of searchData) {
                  if (result.address && result.address.postcode && result.address.postcode !== 'M23 0GB') {
                    bestAddress = result.address;
                    console.log('Found specific address via search:', result.address.postcode);
                    break;
                  }
                }
              }
            } catch (err) {
              console.error('Search fallback failed:', err);
            }
          }
          
          // Strategy 3: Use UK PostCode API as fallback for accurate postcode
          if (!bestAddress || bestAddress.postcode === 'M23 0GB') {
            try {
              const postcodeResponse = await fetch(
                `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`
              );
              
              if (postcodeResponse.ok) {
                const postcodeData = await postcodeResponse.json();
                if (postcodeData.result && postcodeData.result.length > 0) {
                  const ukData = postcodeData.result[0];
                  // Merge UK postcode data with our address
                  if (bestAddress) {
                    bestAddress.postcode = ukData.postcode;
                    bestAddress.county = ukData.admin_county || bestAddress.county;
                  } else {
                    bestAddress = {
                      house_number: '',
                      road: '',
                      suburb: ukData.parish || ukData.admin_ward,
                      city: ukData.admin_district,
                      county: ukData.admin_county,
                      postcode: ukData.postcode,
                      country: 'United Kingdom'
                    };
                  }
                  console.log('Used UK PostCode API for accurate postcode:', ukData.postcode);
                }
              }
            } catch (err) {
              console.error('UK PostCode API failed:', err);
            }
          }
          
          // Fall back to original data if no better address found
          if (!bestAddress) {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=en`
            );
            const data = await response.json();
            bestAddress = data.address || {};
          }
          
          // Get the local area name - prioritize specific areas over generic ones
          const getLocalArea = (address: any) => {
            // Prioritize suburb, neighbourhood, village, hamlet over generic city
            const localArea = address.suburb || 
                            address.neighbourhood || 
                            address.village || 
                            address.hamlet ||
                            address.district ||
                            address.borough ||
                            address.city_district ||
                            '';
            
            // Don't use unparished areas
            if (localArea && localArea !== 'Unparished Area') {
              return localArea;
            }
            
            return '';
          };
          
          const localArea = getLocalArea(bestAddress);
          const city = bestAddress.city || bestAddress.town || 'Manchester';
          
          // Create comprehensive town/city name
          let townCity = '';
          if (localArea && localArea !== city) {
            townCity = `${localArea}, ${city}`;
          } else {
            townCity = city;
          }
          
          // Map the best address to our structure
          const detectedAddress: AddressData = {
            address_line_1: bestAddress.house_number || '',
            address_line_2: bestAddress.road || bestAddress.street || '',
            town_city: townCity,
            county: bestAddress.county || bestAddress.state_district || bestAddress.state || 'Greater Manchester',
            postcode: bestAddress.postcode || '',
            country: bestAddress.country || 'United Kingdom',
            is_public: value.is_public // Preserve existing privacy setting
          };
          
          onChange(detectedAddress);
          
        } catch (error) {
          // Fail silently - user can enter manually
          console.error('Error reverse geocoding:', error);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        // Fail silently - user can enter manually
        console.error('Geolocation error:', error);
        setDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for multiple API calls
        maximumAge: 300000
      }
    );
  };

  const isFieldValid = (field: keyof AddressData): boolean => {
    const fieldValue = value[field];
    if (field === 'is_public') {
      return true; // Boolean field is always valid
    }
    if (!fieldValue) return false;
    
    if (field === 'postcode' && value.country === 'United Kingdom') {
      return validateUKPostcode(fieldValue as string);
    }
    
    return true;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with geolocation button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-accent">Business Address</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={detecting}
          className="border-accent hover:bg-accent hover:text-white transition-all duration-200"
        >
          <Locate className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
          {detecting ? 'Detecting...' : 'Use My Location'}
        </Button>
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Postcode - First Field */}
        <div className="md:col-span-2">
          <Label htmlFor="postcode" className="text-sm font-medium text-accent">
            Postcode <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-blue-600 mt-1 mb-2">
            💡 Enter your postcode first to find your address
          </p>
          <div className="relative">
            <Input
              id="postcode"
              value={value.postcode}
              onChange={(e) => {
                const newPostcode = e.target.value.toUpperCase();
                handleFieldChange('postcode', newPostcode);
                // Auto-lookup when postcode looks complete
                if (newPostcode.length >= 6 && newPostcode.length <= 8) {
                  lookupPostcodeAddresses(newPostcode);
                }
              }}
              placeholder="M23 9NY"
              autoComplete="postal-code"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                errors.postcode ? 'border-destructive' : ''
              )}
            />
            {lookingUpPostcode && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
              </div>
            )}
            {value.postcode && isFieldValid('postcode') && !errors.postcode && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
          {errors.postcode && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.postcode}
            </p>
          )}
        </div>

        {/* Address Selector - Shows after postcode lookup */}
        {showAddressSelector && availableAddresses.length > 0 && (
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-accent">
              Select Your Address <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-green-600 mt-1 mb-2">
              ✅ Found {availableAddresses.length} address(es) for {value.postcode}
            </p>
            <Select onValueChange={(selectedIndex) => selectAddress(availableAddresses[parseInt(selectedIndex)])}>
              <SelectTrigger className="border-2 border-green-300 bg-green-50/50">
                <SelectValue placeholder="👆 Click here to select your address" />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/20 max-h-[200px] z-50">
                {availableAddresses.map((address, index) => (
                  <SelectItem key={index} value={index.toString()} className="cursor-pointer hover:bg-accent/10">
                    {address.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Address Line 1 - House Number/Name (Auto-filled from selection) */}
        <div className="md:col-span-1">
          <Label htmlFor="address_line_1" className="text-sm font-medium text-accent">
            House Number/Name <span className="text-muted-foreground">(Auto-filled)</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="address_line_1"
              value={value.address_line_1}
              onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
              placeholder="Will be filled when you select address"
              autoComplete="address-line1"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                value.address_line_1 ? 'bg-green-50/50' : ''
              )}
              readOnly={showAddressSelector}
            />
            {value.address_line_1 && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
        </div>

        {/* Address Line 2 - Street Name (Auto-filled from selection) */}
        <div className="md:col-span-1">
          <Label htmlFor="address_line_2" className="text-sm font-medium text-accent">
            Street Name <span className="text-muted-foreground">(Auto-filled)</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="address_line_2"
              value={value.address_line_2}
              onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
              placeholder="Will be filled when you select address"
              autoComplete="address-line2"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                value.address_line_2 ? 'bg-green-50/50' : '',
                errors.address_line_2 ? 'border-destructive' : ''
              )}
              readOnly={showAddressSelector}
            />
            {value.address_line_2 && !errors.address_line_2 && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
          {errors.address_line_2 && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.address_line_2}
            </p>
          )}
        </div>

        {/* Town/City (Auto-filled) */}
        <div>
          <Label htmlFor="town_city" className="text-sm font-medium text-accent">
            Town/City <span className="text-muted-foreground">(Auto-filled)</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="town_city"
              value={value.town_city}
              onChange={(e) => handleFieldChange('town_city', e.target.value)}
              placeholder="Will be filled from postcode"
              autoComplete="address-level2"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                value.town_city ? 'bg-green-50/50' : '',
                errors.town_city ? 'border-destructive' : ''
              )}
              readOnly
            />
            {value.town_city && isFieldValid('town_city') && !errors.town_city && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
          {errors.town_city && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.town_city}
            </p>
          )}
        </div>

        {/* County (Auto-filled) */}
        <div>
          <Label htmlFor="county" className="text-sm font-medium text-accent">
            County <span className="text-muted-foreground">(Auto-filled)</span>
          </Label>
          <div className="mt-1">
            <Input
              id="county"
              value={value.county}
              onChange={(e) => handleFieldChange('county', e.target.value)}
              placeholder="Will be filled from postcode"
              autoComplete="address-level1"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                value.county ? 'bg-green-50/50' : '',
                errors.county ? 'border-destructive' : ''
              )}
              readOnly
            />
            {errors.county && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.county}
              </p>
            )}
          </div>
        </div>

        {/* Country */}
        <div>
          <Label htmlFor="country" className="text-sm font-medium text-accent">
            Country <span className="text-destructive">*</span>
          </Label>
          <div className="mt-1">
            <Select value={value.country} onValueChange={(val) => handleFieldChange('country', val)}>
              <SelectTrigger className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                errors.country ? 'border-destructive' : ''
              )}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/20">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.country}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="border-t border-accent/20 pt-6 mt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-accent" />
            <h4 className="text-lg font-semibold text-accent">Address Privacy</h4>
          </div>
          
          <div className="bg-muted/30 border border-accent/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="is_public"
                checked={value.is_public}
                onCheckedChange={(checked) => handleFieldChange('is_public', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="is_public" className="text-sm font-medium cursor-pointer flex items-center">
                  {value.is_public ? (
                    <Eye className="h-4 w-4 mr-2 text-accent" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                  )}
                  Allow customers to see my full business address
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {value.is_public ? (
                    <>
                      <span className="text-accent font-medium">Public:</span> Customers will see your full address when booking appointments. 
                      Recommended for commercial premises or businesses that welcome walk-ins.
                    </>
                  ) : (
                    <>
                      <span className="text-orange-600 font-medium">Private:</span> Only your general area (town/city) will be visible to customers. 
                      Full address will be shared after booking confirmation. Perfect for home-based businesses.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};