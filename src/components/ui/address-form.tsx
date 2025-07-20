import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
  const [step, setStep] = useState<'input' | 'select' | 'confirm'>('input');
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const { toast } = useToast();

  // Function to search for addresses based on user input
  const findAddresses = async () => {
    if (!searchInput.trim()) {
      toast({ title: "Please enter a postcode or address", variant: "destructive" });
      return;
    }
    
    setSearching(true);
    setAvailableAddresses([]);
    
    try {
      // Clean input
      const cleanInput = searchInput.trim().toUpperCase();
      
      // Check if it's a postcode or postcode + street
      const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(cleanInput.replace(/\s/g, ''));
      
      let searchUrl = '';
      if (isPostcode) {
        // Search by postcode only
        const cleanPostcode = cleanInput.replace(/\s/g, '');
        searchUrl = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPostcode}&countrycodes=gb&addressdetails=1&limit=50`;
      } else {
        // Search by address string
        searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanInput)}&countrycodes=gb&addressdetails=1&limit=50`;
      }
      
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length > 0) {
          // Group addresses by house number and remove duplicates
          const addressMap = new Map();
          
          data.forEach((item: any) => {
            const address = item.address;
            const houseNumber = address.house_number;
            const streetName = address.road || address.street || '';
            const postcode = address.postcode;
            
            if (houseNumber && streetName && postcode) {
              const key = `${houseNumber}-${streetName}-${postcode}`;
              if (!addressMap.has(key)) {
                const suburb = address.suburb || address.neighbourhood || '';
                const city = address.city || address.town || 'Manchester';
                
                let townCity = '';
                if (suburb && suburb !== 'Unparished Area' && suburb !== city) {
                  townCity = `${suburb}, ${city}`;
                } else {
                  townCity = city;
                }
                
                addressMap.set(key, {
                  house_number: houseNumber,
                  street: streetName,
                  suburb: suburb,
                  city: city,
                  county: address.county || address.state_district || 'Greater Manchester',
                  postcode: postcode,
                  country: address.country || 'United Kingdom',
                  town_city: townCity,
                  displayName: `${houseNumber} ${streetName}, ${townCity}, ${postcode}`
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
          
          if (addresses.length > 0) {
            setStep('select');
          } else {
            toast({ title: "No addresses found", description: "Please try a different postcode or address", variant: "destructive" });
          }
        } else {
          toast({ title: "No addresses found", description: "Please try a different postcode or address", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('Address search failed:', error);
      toast({ title: "Search failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  // Handle address selection
  const selectAddress = (address: any) => {
    setSelectedAddress(address);
    
    const fullAddress: AddressData = {
      address_line_1: address.house_number,
      address_line_2: address.street,
      town_city: address.town_city,
      county: address.county,
      postcode: address.postcode,
      country: address.country,
      is_public: value.is_public
    };
    
    onChange(fullAddress);
    setStep('confirm');
  };

  // Confirm and finish address entry
  const confirmAddress = () => {
    toast({ title: "Address added successfully!", variant: "default" });
    // Address is already set in selectAddress
  };

  // Reset to start over
  const startOver = () => {
    setStep('input');
    setSearchInput('');
    setAvailableAddresses([]);
    setSelectedAddress(null);
    onChange({
      address_line_1: '',
      address_line_2: '',
      town_city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom',
      is_public: value.is_public
    });
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string | boolean) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-accent">Business Address</h3>
      </div>

      {/* Step 1: Address Input */}
      {step === 'input' && (
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              <span>Enter Your Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search-input" className="text-sm font-medium">
                Start typing your address or postcode
              </Label>
              <div className="relative mt-2">
                <Input
                  id="search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., M23 9NY or M23 9NY Oxford Road"
                  className="pr-12 focus:border-accent focus:ring-accent"
                  onKeyPress={(e) => e.key === 'Enter' && findAddresses()}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <Button 
              onClick={findAddresses} 
              disabled={searching || !searchInput.trim()}
              className="w-full bg-accent hover:bg-accent/90"
            >
              <Search className={`h-4 w-4 mr-2 ${searching ? 'animate-spin' : ''}`} />
              {searching ? 'Searching...' : 'Find My Address'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Address Selection */}
      {step === 'select' && (
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              <span>Select Your House Number</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose your address from the list below:
            </p>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableAddresses.map((address, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:border-accent hover:bg-accent/5 text-left"
                  onClick={() => selectAddress(address)}
                >
                  <div>
                    <div className="font-medium">{address.house_number} {address.street}</div>
                    <div className="text-sm text-muted-foreground">{address.town_city}, {address.postcode}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => setStep('input')}
              className="w-full"
            >
              ← Back to Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm Address */}
      {step === 'confirm' && (
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              <span>Confirm Your Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-green-800">Selected Address:</h4>
              <div className="text-sm space-y-1">
                <div><strong>House Number/Name:</strong> {value.address_line_1}</div>
                <div><strong>Street:</strong> {value.address_line_2}</div>
                <div><strong>Town/City:</strong> {value.town_city}</div>
                <div><strong>County:</strong> {value.county}</div>
                <div><strong>Postcode:</strong> {value.postcode}</div>
                <div><strong>Country:</strong> {value.country}</div>
              </div>
            </div>

            {/* Manual Edit Fields (if needed) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-line1" className="text-sm font-medium">
                    House Number/Name
                  </Label>
                  <Input
                    id="edit-line1"
                    value={value.address_line_1}
                    onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-line2" className="text-sm font-medium">
                    Street <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-line2"
                    value={value.address_line_2}
                    onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
                    className={errors.address_line_2 ? 'border-destructive' : ''}
                  />
                  {errors.address_line_2 && (
                    <p className="text-sm text-destructive mt-1">{errors.address_line_2}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-town" className="text-sm font-medium">
                    Town/City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-town"
                    value={value.town_city}
                    onChange={(e) => handleFieldChange('town_city', e.target.value)}
                    className={errors.town_city ? 'border-destructive' : ''}
                  />
                  {errors.town_city && (
                    <p className="text-sm text-destructive mt-1">{errors.town_city}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="edit-county" className="text-sm font-medium">
                    County <span className="text-destructive">*</span>
                  </Label>
                  <Select value={value.county} onValueChange={(val) => handleFieldChange('county', val)}>
                    <SelectTrigger className={errors.county ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {UK_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.county && (
                    <p className="text-sm text-destructive mt-1">{errors.county}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-postcode" className="text-sm font-medium">
                    Postcode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-postcode"
                    value={value.postcode}
                    onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
                    className={errors.postcode ? 'border-destructive' : ''}
                  />
                  {errors.postcode && (
                    <p className="text-sm text-destructive mt-1">{errors.postcode}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="edit-country" className="text-sm font-medium">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select value={value.country} onValueChange={(val) => handleFieldChange('country', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="address-public"
                checked={value.is_public}
                onCheckedChange={(checked) => handleFieldChange('is_public', checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="address-public" className="flex items-center space-x-2 cursor-pointer">
                  {value.is_public ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {value.is_public ? 'Address visible to customers' : 'Address hidden from customers'}
                  </span>
                </Label>
                <p className="text-xs text-muted-foreground ml-6">
                  {value.is_public 
                    ? 'Customers can see your full business address' 
                    : 'Only general area (town/city) will be visible to customers'
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={confirmAddress}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use This Address
              </Button>
              
              <Button 
                variant="outline" 
                onClick={startOver}
                className="flex-1"
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};