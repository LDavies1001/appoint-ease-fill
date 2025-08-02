import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Check, AlertCircle, Loader2, Search, Eye, EyeOff, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressData {
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  postcode: string;
  is_public: boolean;
  admin_district?: string;
  admin_ward?: string;
  latitude?: number;
  longitude?: number;
}

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

interface AddressLookupProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  className?: string;
}

export const AddressLookup: React.FC<AddressLookupProps> = ({
  value,
  onChange,
  errors = {},
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [step, setStep] = useState<'search' | 'details' | 'privacy'>('search');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize search query from existing address and auto-populate city if needed
  useEffect(() => {
    if (value.postcode && !searchQuery) {
      setSearchQuery(value.postcode);
      if (value.address_line_1 && value.town_city) {
        setIsAddressSelected(true);
        setStep('privacy');
      } else if (value.postcode && !value.town_city) {
        // If we have a postcode but no town/city, fetch it automatically
        validateAndGetPostcodeDetails(value.postcode);
      }
    }
  }, [value]);

  // Debounced search for autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2 && !isAddressSelected) {
        searchPostcodes(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isAddressSelected]);

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
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && Array.isArray(data.result)) {
          setSuggestions(data.result.slice(0, 5));
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
    
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const locationData: PostcodeResult = data.result;
          
          // Auto-populate address data
          const updatedAddress: AddressData = {
            ...value,
            postcode: locationData.postcode,
            town_city: locationData.admin_district || locationData.admin_ward || locationData.parish || '',
            admin_district: locationData.admin_district,
            admin_ward: locationData.admin_ward,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          };
          
          onChange(updatedAddress);
          setIsAddressSelected(true);
          setStep('details');
          setShowSuggestions(false);
          
          return true;
        }
      }
    } catch (error) {
      console.error('Error validating postcode:', error);
    } finally {
      setIsLoading(false);
    }
    
    return false;
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    await validateAndGetPostcodeDetails(suggestion);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await validateAndGetPostcodeDetails(searchQuery.trim());
    }
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string | boolean) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  const handleStartOver = () => {
    setSearchQuery('');
    setIsAddressSelected(false);
    setStep('search');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({
      address_line_1: '',
      address_line_2: '',
      town_city: '',
      postcode: '',
      is_public: false
    });
  };

  const renderSearchStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-2">
          <MapPin className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-xl font-semibold text-accent">Find Your Business Address</h3>
        <p className="text-muted-foreground">
          Enter your postcode or start typing your address to get started
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              const newValue = e.target.value.toUpperCase();
              setSearchQuery(newValue);
              // Reset the address selection if user starts typing a new search
              if (isAddressSelected && newValue !== value.postcode) {
                setIsAddressSelected(false);
                setStep('search');
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="e.g., SW1A 1AA or start typing your address..."
            className="pl-10 pr-12 h-12 text-lg border-2 border-accent/30 focus:border-accent"
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 bg-accent hover:bg-accent/90"
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
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
                className="w-full px-4 py-3 text-left hover:bg-accent/10 focus:bg-accent/10 focus:outline-none transition-colors border-b border-border/50 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-mono text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {errors.postcode && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{errors.postcode}</p>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-accent">Complete Your Address</h3>
        <p className="text-muted-foreground">
          We found your postcode! Now add your house number and street details.
        </p>
      </div>

      <Card className="border-accent/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="font-medium text-accent">Postcode: {value.postcode}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-muted-foreground hover:text-accent"
            >
              Change
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="house_number">
                House Number/Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="house_number"
                value={value.address_line_1}
                onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
                placeholder="e.g., 123 or Oak House"
                className={errors.address_line_1 ? 'border-destructive' : ''}
              />
              {errors.address_line_1 && (
                <p className="text-sm text-destructive mt-1">{errors.address_line_1}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="street_name">
                Street Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="street_name"
                value={value.address_line_2}
                onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
                placeholder="e.g., Oxford Road"
                className={errors.address_line_2 ? 'border-destructive' : ''}
              />
              {errors.address_line_2 && (
                <p className="text-sm text-destructive mt-1">{errors.address_line_2}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="town_city">
              Town/City <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="town_city"
                value={value.town_city}
                onChange={(e) => handleFieldChange('town_city', e.target.value)}
                placeholder="e.g., Manchester"
                className={cn(
                  errors.town_city ? 'border-destructive' : '',
                  value.admin_district ? 'bg-green-50 border-green-200' : ''
                )}
                readOnly={!!value.admin_district}
              />
              {value.admin_district && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            {value.admin_district && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Auto-populated from postcode lookup
              </p>
            )}
            {errors.town_city && (
              <p className="text-sm text-destructive mt-1">{errors.town_city}</p>
            )}
          </div>

          <Button
            onClick={() => setStep('privacy')}
            className="w-full bg-accent hover:bg-accent/90"
            disabled={!value.address_line_1 || !value.address_line_2 || !value.town_city}
          >
            Continue to Privacy Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrivacyStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
          <Home className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-accent">Address Privacy</h3>
        <p className="text-muted-foreground">
          Choose how much of your address customers can see publicly
        </p>
      </div>

      {/* Address Preview */}
      <Card className="border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium text-accent">Your Business Address:</p>
              <div className="text-sm text-muted-foreground mt-1">
                <p>{value.address_line_1} {value.address_line_2}</p>
                <p>{value.town_city}, {value.postcode}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('details')}
                className="mt-2 text-muted-foreground hover:text-accent p-0 h-auto"
              >
                Edit address
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Options */}
      <div className="space-y-3">
        <div 
          className={cn(
            "flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            !value.is_public 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
              : "border-border bg-background hover:border-muted-foreground/30"
          )}
          onClick={() => handleFieldChange('is_public', false)}
        >
          <div className="flex items-center justify-center w-5 h-5 mt-0.5">
            <div className={cn(
              "w-4 h-4 rounded-full",
              !value.is_public ? "bg-blue-500" : "border-2 border-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <EyeOff className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Keep private (Recommended)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Show only your town/city and area postcode (e.g., M23). Perfect if you work from your home address or want to keep your exact location private. Share full address when customers book.
            </p>
            <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">
              Preview: {value.town_city}, {value.postcode.split(' ')[0]}
            </Badge>
          </div>
        </div>

        <div 
          className={cn(
            "flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            value.is_public 
              ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
              : "border-border bg-background hover:border-muted-foreground/30"
          )}
          onClick={() => handleFieldChange('is_public', true)}
        >
          <div className="flex items-center justify-center w-5 h-5 mt-0.5">
            <div className={cn(
              "w-4 h-4 rounded-full",
              value.is_public ? "bg-green-500" : "border-2 border-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="font-medium">Show full address</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Display your complete address publicly. Easier for customers to find you.
            </p>
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
              Preview: {value.address_line_1} {value.address_line_2}, {value.town_city}, {value.postcode}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {step === 'search' && renderSearchStep()}
      {step === 'details' && renderDetailsStep()}
      {step === 'privacy' && renderPrivacyStep()}
    </div>
  );
};