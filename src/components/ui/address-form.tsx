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
  const [houseNumbers, setHouseNumbers] = useState<string[]>([]);
  const [streetName, setStreetName] = useState<string>('');
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive"
      });
      return;
    }

    setDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap's Nominatim for reverse geocoding with high precision
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1&zoom=18&accept-language=en`
          );
          
          if (!response.ok) throw new Error('Failed to get location');
          
          const data = await response.json();
          const address = data.address || {};
          
          // Extract street name and set up house number options
          const detectedStreetName = address.road || address.street || '';
          setStreetName(detectedStreetName);
          setIsLocationDetected(true);
          
          // Generate house number options (typical range for UK streets)
          const currentHouseNumber = address.house_number;
          const houseNumberOptions: string[] = [];
          
          if (currentHouseNumber) {
            const baseNumber = parseInt(currentHouseNumber);
            if (!isNaN(baseNumber)) {
              // Generate a range around the detected number
              for (let i = Math.max(1, baseNumber - 10); i <= baseNumber + 10; i++) {
                houseNumberOptions.push(i.toString());
              }
            }
          } else {
            // Default range if no house number detected
            for (let i = 1; i <= 50; i++) {
              houseNumberOptions.push(i.toString());
            }
          }
          
          setHouseNumbers(houseNumberOptions);
          
          // Map the response to our address structure
          const detectedAddress: AddressData = {
            address_line_1: currentHouseNumber || '', // Will be selected from dropdown
            address_line_2: detectedStreetName, // Street name goes to line 2
            town_city: address.suburb || address.neighbourhood || address.city || address.town || address.village || address.hamlet || '',
            county: address.county || address.state_district || address.state || '',
            postcode: address.postcode || '',
            country: value.country || 'United Kingdom', // Keep existing or default
            is_public: value.is_public // Preserve existing privacy setting
          };
          
          onChange(detectedAddress);
          
          toast({
            title: "Location detected! ✅",
            description: `Found ${detectedAddress.town_city}. Please verify your postcode and select house number.`,
            duration: 6000
          });
          
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          toast({
            title: "Location detection failed",
            description: "Could not determine your address. Please enter manually.",
            variant: "destructive"
          });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetecting(false);
        
        let message = "Could not access your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable location permissions";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }
        
        toast({
          title: "Location detection failed",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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
        {/* Address Line 1 - House Number */}
        <div className="md:col-span-2">
          <Label htmlFor="address_line_1" className="text-sm font-medium text-accent">
            {isLocationDetected ? 'House Number' : 'Address Line 1'} <span className="text-destructive">*</span>
          </Label>
          {isLocationDetected && (
            <p className="text-sm text-blue-600 mt-1 mb-2 font-medium">
              📍 Location detected! Please select your house number below:
            </p>
          )}
          <div className="relative mt-1">
            {isLocationDetected && houseNumbers.length > 0 ? (
              <Select value={value.address_line_1} onValueChange={(val) => handleFieldChange('address_line_1', val)}>
                <SelectTrigger className={cn(
                  "transition-all duration-200 focus:border-accent focus:ring-accent border-2",
                  errors.address_line_1 ? 'border-destructive' : 'border-blue-300 bg-blue-50/50'
                )}>
                  <SelectValue placeholder="👆 Click here to select your house number" />
                </SelectTrigger>
                <SelectContent className="bg-background border-accent/20 max-h-[200px] z-50">
                  {houseNumbers.map((number) => (
                    <SelectItem key={number} value={number} className="cursor-pointer hover:bg-accent/10">
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="address_line_1"
                value={value.address_line_1}
                onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
                placeholder="123 High Street"
                autoComplete="address-line1"
                className={cn(
                  "transition-all duration-200 focus:border-accent focus:ring-accent",
                  errors.address_line_1 ? 'border-destructive' : ''
                )}
              />
            )}
            {value.address_line_1 && isFieldValid('address_line_1') && !errors.address_line_1 && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
          {errors.address_line_1 && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.address_line_1}
            </p>
          )}
        </div>

        {/* Address Line 2 - Street Name */}
        <div className="md:col-span-2">
          <Label htmlFor="address_line_2" className="text-sm font-medium text-accent">
            {isLocationDetected ? 'Street Name' : 'Address Line 2'} 
            {isLocationDetected ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(Optional)</span>}
          </Label>
          <div className="relative mt-1">
            <Input
              id="address_line_2"
              value={value.address_line_2}
              onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
              placeholder={isLocationDetected ? "Street name" : "Apartment, suite, unit, building, floor, etc."}
              autoComplete="address-line2"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                isLocationDetected && errors.address_line_2 ? 'border-destructive' : ''
              )}
            />
            {isLocationDetected && value.address_line_2 && !errors.address_line_2 && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
            )}
          </div>
          {isLocationDetected && errors.address_line_2 && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.address_line_2}
            </p>
          )}
        </div>

        {/* Town/City */}
        <div>
          <Label htmlFor="town_city" className="text-sm font-medium text-accent">
            Town/City <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="town_city"
              value={value.town_city}
              onChange={(e) => handleFieldChange('town_city', e.target.value)}
              placeholder="London"
              autoComplete="address-level2"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                errors.town_city ? 'border-destructive' : ''
              )}
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

        {/* County */}
        <div>
          <Label htmlFor="county" className="text-sm font-medium text-accent">
            County <span className="text-destructive">*</span>
          </Label>
          <div className="mt-1">
            {value.country === 'United Kingdom' ? (
              <Select value={value.county} onValueChange={(val) => handleFieldChange('county', val)}>
                <SelectTrigger className={cn(
                  "transition-all duration-200 focus:border-accent focus:ring-accent",
                  errors.county ? 'border-destructive' : ''
                )}>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent className="bg-background border-accent/20 max-h-[200px]">
                  {UK_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="county"
                value={value.county}
                onChange={(e) => handleFieldChange('county', e.target.value)}
                placeholder="State/Province/County"
                autoComplete="address-level1"
                className={cn(
                  "transition-all duration-200 focus:border-accent focus:ring-accent",
                  errors.county ? 'border-destructive' : ''
                )}
              />
            )}
            {errors.county && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.county}
              </p>
            )}
          </div>
        </div>

        {/* Postcode */}
        <div>
          <Label htmlFor="postcode" className="text-sm font-medium text-accent">
            Postcode <span className="text-destructive">*</span>
          </Label>
          {isLocationDetected && (
            <p className="text-sm text-amber-600 mt-1 mb-2 font-medium">
              ⚠️ Please verify your postcode - location detection may show a general area code
            </p>
          )}
          <div className="relative mt-1">
            <Input
              id="postcode"
              value={value.postcode}
              onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
              placeholder="M23 9NY"
              autoComplete="postal-code"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
                isLocationDetected ? 'border-amber-300 bg-amber-50/50' : '',
                errors.postcode ? 'border-destructive' : ''
              )}
            />
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