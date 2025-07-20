import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Locate, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface AddressData {
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  county: string;
  postcode: string;
  country: string;
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
  const { toast } = useToast();

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
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
          
          // Use OpenStreetMap's Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1`
          );
          
          if (!response.ok) throw new Error('Failed to get location');
          
          const data = await response.json();
          const address = data.address || {};
          
          // Map the response to our address structure
          const detectedAddress: AddressData = {
            address_line_1: [
              address.house_number,
              address.road || address.street
            ].filter(Boolean).join(' ') || '',
            address_line_2: address.suburb || address.neighbourhood || '',
            town_city: address.city || address.town || address.village || '',
            county: address.county || address.state || '',
            postcode: address.postcode || '',
            country: value.country || 'United Kingdom' // Keep existing or default
          };
          
          onChange(detectedAddress);
          
          toast({
            title: "Location detected",
            description: "Address fields have been auto-filled with your current location"
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
    if (!fieldValue) return false;
    
    if (field === 'postcode' && value.country === 'United Kingdom') {
      return validateUKPostcode(fieldValue);
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
        {/* Address Line 1 */}
        <div className="md:col-span-2">
          <Label htmlFor="address_line_1" className="text-sm font-medium text-accent">
            Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1">
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

        {/* Address Line 2 */}
        <div className="md:col-span-2">
          <Label htmlFor="address_line_2" className="text-sm font-medium text-accent">
            Address Line 2 <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="address_line_2"
              value={value.address_line_2}
              onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
              autoComplete="address-line2"
              className="transition-all duration-200 focus:border-accent focus:ring-accent"
            />
          </div>
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
          <div className="relative mt-1">
            <Input
              id="postcode"
              value={value.postcode}
              onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              autoComplete="postal-code"
              className={cn(
                "transition-all duration-200 focus:border-accent focus:ring-accent",
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
    </div>
  );
};