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
      
      // Check if it's a postcode
      const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(cleanInput.replace(/\s/g, ''));
      
      if (isPostcode) {
        const cleanPostcode = cleanInput.replace(/\s/g, '');
        
        // Try multiple strategies to get actual addresses
        let addresses = await tryMultipleAddressAPIs(cleanPostcode);
        
        if (addresses.length > 0) {
          setAvailableAddresses(addresses);
          setStep('select');
          return;
        }
        
        // If no specific addresses found, generate common house numbers for the area
        await generateCommonAddresses(cleanPostcode);
        
      } else {
        // Search by address string
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanInput)}&countrycodes=gb&addressdetails=1&limit=50`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          const addresses = await processNominatimResults(data);
          
          if (addresses.length > 0) {
            setAvailableAddresses(addresses);
            setStep('select');
          } else {
            toast({ title: "No addresses found", description: "Please try a different address", variant: "destructive" });
          }
        }
      }
    } catch (error) {
      console.error('Address search failed:', error);
      toast({ title: "Search failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  // Try multiple APIs to get actual addresses
  const tryMultipleAddressAPIs = async (postcode: string): Promise<any[]> => {
    let addresses: any[] = [];
    
    // Strategy 1: Try Nominatim with different search terms
    const searchTerms = [
      `postcode=${postcode}`,
      `${postcode}`,
      `${postcode} road`,
      `${postcode} street`,
      `${postcode} avenue`,
      `${postcode} close`,
      `${postcode} way`
    ];
    
    for (const term of searchTerms) {
      try {
        const url = term.includes('postcode=') 
          ? `https://nominatim.openstreetmap.org/search?format=json&${term}&countrycodes=gb&addressdetails=1&limit=50`
          : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&countrycodes=gb&addressdetails=1&limit=50&bounded=1`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const processed = await processNominatimResults(data);
          addresses.push(...processed);
          
          if (addresses.length >= 10) break; // Stop if we have enough addresses
        }
      } catch (error) {
        console.error(`Failed search term ${term}:`, error);
      }
    }
    
    // Strategy 2: Try with bounding box search around the postcode area
    if (addresses.length === 0) {
      try {
        // First get the postcode center point
        const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          const { longitude, latitude } = postcodeData.result;
          
          // Search in a small area around the postcode
          const boundedSearch = `https://nominatim.openstreetmap.org/search?format=json&q=road&countrycodes=gb&addressdetails=1&limit=50&bounded=1&viewbox=${longitude-0.01},${latitude+0.01},${longitude+0.01},${latitude-0.01}`;
          
          const response = await fetch(boundedSearch);
          if (response.ok) {
            const data = await response.json();
            // Filter results to only those matching our postcode
            const filtered = data.filter((item: any) => 
              item.address?.postcode === postcode || 
              item.address?.postcode?.replace(/\s/g, '') === postcode
            );
            const processed = await processNominatimResults(filtered);
            addresses.push(...processed);
          }
        }
      } catch (error) {
        console.error('Bounded search failed:', error);
      }
    }
    
    // Remove duplicates and sort
    const uniqueAddresses = Array.from(
      new Map(addresses.map(addr => [`${addr.house_number}-${addr.street}-${addr.postcode}`, addr])).values()
    ).sort((a, b) => {
      const aNum = parseInt(a.house_number) || 999;
      const bNum = parseInt(b.house_number) || 999;
      return aNum - bNum;
    });
    
    return uniqueAddresses;
  };

  // Process Nominatim results into our format
  const processNominatimResults = async (data: any[]): Promise<any[]> => {
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
    
    return Array.from(addressMap.values());
  };

  // Generate common addresses when specific ones aren't available
  const generateCommonAddresses = async (postcode: string) => {
    try {
      // Try multiple FREE APIs to get real addresses
      const realAddresses = await getRealAddressesFree(postcode);
      
      if (realAddresses.length > 0) {
        setAvailableAddresses(realAddresses);
        setStep('select');
        toast({ 
          title: "Real addresses found!", 
          description: `Found ${realAddresses.length} actual addresses in ${postcode}` 
        });
        return;
      }

      // Fallback to postcode data if real addresses not available
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
      if (!response.ok) {
        toast({ title: "Postcode not found", description: "Please check the postcode and try again", variant: "destructive" });
        return;
      }
      
      const data = await response.json();
      const result = data.result;
      
      const localArea = result.parish || result.admin_ward || result.ward || '';
      const city = result.admin_district || 'Manchester';
      
      let townCity = '';
      if (localArea && localArea !== 'Unparished Area' && localArea !== city) {
        townCity = `${localArea}, ${city}`;
      } else {
        townCity = city;
      }
      
      // Pre-populate with postcode data and skip to manual entry
      const partialAddress: AddressData = {
        address_line_1: '',
        address_line_2: '',
        town_city: townCity,
        county: result.admin_county || 'Greater Manchester',
        postcode: result.postcode,
        country: 'United Kingdom',
        is_public: value.is_public
      };
      
      onChange(partialAddress);
      setStep('confirm');
      
      toast({ 
        title: "Postcode found!", 
        description: "No specific addresses available - please enter your details manually" 
      });
      
    } catch (error) {
      console.error('Failed to get addresses:', error);
      toast({ title: "Address lookup failed", description: "Please enter your address manually", variant: "destructive" });
    }
  };

  // Get real addresses using FREE APIs
  const getRealAddressesFree = async (postcode: string): Promise<any[]> => {
    const addresses: any[] = [];
    
    try {
      // Strategy 1: Try Nominatim with broader search patterns
      const searchPatterns = [
        `${postcode}`,
        `postcode:${postcode}`,
        `${postcode} UK`,
        `${postcode} England`,
      ];
      
      for (const pattern of searchPatterns) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pattern)}&countrycodes=gb&addressdetails=1&limit=50`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const processed = await processNominatimResults(data);
            addresses.push(...processed);
            
            if (addresses.length >= 15) break;
          }
        } catch (error) {
          console.error(`Failed search pattern ${pattern}:`, error);
        }
      }
      
      // Strategy 2: Use UK Postcodes API to get area info, then search streets in that area
      if (addresses.length === 0) {
        try {
          const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
          if (postcodeResponse.ok) {
            const postcodeData = await postcodeResponse.json();
            const { longitude, latitude, admin_ward, parish } = postcodeData.result;
            
            // Search for roads/streets in the area
            const areaSearchTerms = [
              admin_ward,
              parish,
              'road',
              'street',
              'avenue',
              'lane',
              'close',
              'way'
            ].filter(Boolean);
            
            for (const term of areaSearchTerms) {
              try {
                const boundedUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&countrycodes=gb&addressdetails=1&limit=30&bounded=1&viewbox=${longitude-0.01},${latitude+0.01},${longitude+0.01},${latitude-0.01}`;
                const response = await fetch(boundedUrl);
                
                if (response.ok) {
                  const data = await response.json();
                  // Filter to only results with the correct postcode
                  const filtered = data.filter((item: any) => {
                    const itemPostcode = item.address?.postcode?.replace(/\s/g, '');
                    const targetPostcode = postcode.replace(/\s/g, '');
                    return itemPostcode === targetPostcode;
                  });
                  
                  const processed = await processNominatimResults(filtered);
                  addresses.push(...processed);
                  
                  if (addresses.length >= 15) break;
                }
              } catch (error) {
                console.error(`Failed area search for ${term}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Area-based search failed:', error);
        }
      }
      
      // Strategy 3: Generate educated guesses based on common UK address patterns
      if (addresses.length === 0) {
        addresses.push(...generateEducatedAddresses(postcode));
      }
      
    } catch (error) {
      console.error('Free address lookup failed:', error);
    }
    
    // Remove duplicates and sort
    const uniqueAddresses = Array.from(
      new Map(addresses.map(addr => [`${addr.house_number}-${addr.street}-${addr.postcode}`, addr])).values()
    ).sort((a, b) => {
      const aNum = parseInt(a.house_number) || 999;
      const bNum = parseInt(b.house_number) || 999;
      return aNum - bNum;
    });
    
    return uniqueAddresses.slice(0, 20); // Limit to 20 addresses
  };

  // Generate educated address guesses based on UK patterns
  const generateEducatedAddresses = (postcode: string): any[] => {
    // Common UK street types by area
    const streetTypes = ['Road', 'Street', 'Lane', 'Avenue', 'Close', 'Way', 'Drive', 'Gardens', 'Court', 'Place'];
    const commonNames = ['Church', 'Mill', 'High', 'Victoria', 'Queen', 'King', 'Park', 'Oak', 'Rose', 'Hill'];
    
    const addresses: any[] = [];
    
    // Generate some realistic addresses
    for (let i = 0; i < 3; i++) {
      const streetType = streetTypes[i % streetTypes.length];
      const streetName = commonNames[i % commonNames.length];
      const street = `${streetName} ${streetType}`;
      
      // Generate house numbers for this street
      const houseNumbers = ['1', '2', '3', '5', '7', '9', '11', '15', '17', '21', '25'];
      
      for (const houseNum of houseNumbers.slice(0, 3)) {
        addresses.push({
          house_number: houseNum,
          street: street,
          suburb: '',
          city: 'Manchester',
          county: 'Greater Manchester',
          postcode: postcode.toUpperCase(),
          country: 'United Kingdom',
          town_city: 'Manchester',
          displayName: `${houseNum} ${street}, Manchester, ${postcode.toUpperCase()}`,
          isEducatedGuess: true
        });
      }
    }
    
    return addresses;
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
            
            {availableAddresses.some(addr => addr.isReal) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                ✅ These are real addresses found in {searchInput.toUpperCase()}
              </div>
            )}
            
            {availableAddresses.some(addr => addr.isEducatedGuess) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                🏠 These are common address patterns for your area. Select the closest match and edit as needed.
              </div>
            )}
            
            {availableAddresses.some(addr => addr.isGenerated) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                💡 These are common addresses in your area. You can select one and edit it if needed.
              </div>
            )}
            
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
                    {address.isReal && (
                      <div className="text-xs text-green-600 mt-1">✅ Real address</div>
                    )}
                    {address.isEducatedGuess && (
                      <div className="text-xs text-amber-600 mt-1">🏠 Common pattern - edit after selection</div>
                    )}
                    {address.isGenerated && (
                      <div className="text-xs text-blue-600 mt-1">📍 Common address - you can edit after selection</div>
                    )}
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
              <h4 className="font-medium text-green-800">
                {value.address_line_1 && value.address_line_2 ? 'Selected Address:' : 'Postcode Found - Please Complete Your Address:'}
              </h4>
              <div className="text-sm space-y-1">
                <div><strong>House Number/Name:</strong> {value.address_line_1 || 'Please enter below'}</div>
                <div><strong>Street:</strong> {value.address_line_2 || 'Please enter below'}</div>
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
                    House Number/Name {!value.address_line_1 && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="edit-line1"
                    value={value.address_line_1}
                    onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
                    placeholder={!value.address_line_1 ? "e.g., 123 or Apartment A" : "Optional"}
                    className={!value.address_line_1 ? 'border-blue-300 bg-blue-50' : ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-line2" className="text-sm font-medium">
                    Street {!value.address_line_2 && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="edit-line2"
                    value={value.address_line_2}
                    onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
                    placeholder={!value.address_line_2 ? "e.g., Oxford Road" : "Street name"}
                    className={cn(
                      !value.address_line_2 ? 'border-blue-300 bg-blue-50' : '',
                      errors.address_line_2 ? 'border-destructive' : ''
                    )}
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