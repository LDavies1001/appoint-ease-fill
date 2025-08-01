import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Navigation, Target } from 'lucide-react';

interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string;
  admin_county: string;
  admin_ward: string;
  parish: string;
  parliamentary_constituency: string;
  region: string;
  country: string;
}

interface CoverageArea {
  postcode: string;
  area_name: string;
  distance_miles: number;
  estimated_customers: number;
}

interface PostcodeLookupProps {
  value?: string;
  onChange: (data: {
    postcode: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    postcodeData: PostcodeData;
    coverageAreas: CoverageArea[];
  }) => void;
  placeholder?: string;
  className?: string;
  showCoverageRadius?: boolean;
  radiusMiles?: number;
}

export const PostcodeLookup: React.FC<PostcodeLookupProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter your business postcode (e.g. SW1A 1AA)',
  className = '',
  showCoverageRadius = true,
  radiusMiles = 5
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [postcodeData, setPostcodeData] = useState<PostcodeData | null>(null);
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [radius, setRadius] = useState(radiusMiles);
  const { toast } = useToast();

  // Debounced postcode lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 5) {
        handlePostcodeLookup();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const validatePostcode = (postcode: string): boolean => {
    // UK postcode regex pattern
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.replace(/\s+/g, ' ').trim());
  };

  const handlePostcodeLookup = async () => {
    const cleanPostcode = inputValue.replace(/\s+/g, ' ').trim().toUpperCase();
    
    if (!validatePostcode(cleanPostcode)) {
      return;
    }

    setIsLoading(true);
    try {
      // Use postcodes.io API for UK postcode lookup
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      
      if (!response.ok) {
        throw new Error('Postcode not found');
      }

      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const result = data.result;
        const postcodeInfo: PostcodeData = {
          postcode: result.postcode,
          latitude: result.latitude,
          longitude: result.longitude,
          admin_district: result.admin_district,
          admin_county: result.admin_county,
          admin_ward: result.admin_ward,
          parish: result.parish,
          parliamentary_constituency: result.parliamentary_constituency,
          region: result.region,
          country: result.country
        };

        setPostcodeData(postcodeInfo);
        
        // Generate coverage areas
        const areas = await generateCoverageAreas(result.latitude, result.longitude, radius);
        setCoverageAreas(areas);

        // Format address
        const formattedAddress = [
          result.admin_ward,
          result.admin_district,
          result.admin_county,
          result.postcode
        ].filter(Boolean).join(', ');

        onChange({
          postcode: result.postcode,
          formattedAddress,
          latitude: result.latitude,
          longitude: result.longitude,
          postcodeData: postcodeInfo,
          coverageAreas: areas
        });

        toast({
          title: "Postcode found",
          description: `Located in ${result.admin_district}, ${result.admin_county}`
        });
      }
    } catch (error) {
      console.error('Postcode lookup error:', error);
      toast({
        title: "Postcode lookup failed",
        description: "Please check the postcode and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCoverageAreas = async (lat: number, lon: number, radiusMiles: number): Promise<CoverageArea[]> => {
    try {
      // Generate nearby postcodes within radius using postcodes.io
      const response = await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&radius=${radiusMiles * 1609}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby areas');
      }

      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const areas: CoverageArea[] = data.result.map((area: any) => ({
          postcode: area.postcode,
          area_name: area.admin_ward || area.admin_district,
          distance_miles: area.distance / 1609.34, // Convert meters to miles
          estimated_customers: Math.floor(Math.random() * 500) + 50 // Mock data for now
        })).slice(0, 20); // Limit to 20 areas

        return areas;
      }
    } catch (error) {
      console.error('Error generating coverage areas:', error);
    }
    
    return [];
  };

  const handleRadiusChange = async (newRadius: number) => {
    setRadius(newRadius);
    if (postcodeData) {
      const areas = await generateCoverageAreas(postcodeData.latitude, postcodeData.longitude, newRadius);
      setCoverageAreas(areas);
      
      onChange({
        postcode: postcodeData.postcode,
        formattedAddress: value,
        latitude: postcodeData.latitude,
        longitude: postcodeData.longitude,
        postcodeData,
        coverageAreas: areas
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            placeholder={placeholder}
            className={`pr-10 ${className}`}
            disabled={isLoading}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your business postcode to automatically determine your service area
        </p>
      </div>

      {postcodeData && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Location Confirmed</h4>
              <p className="text-sm text-muted-foreground">
                {postcodeData.admin_ward}, {postcodeData.admin_district}
              </p>
              <p className="text-xs text-muted-foreground">
                {postcodeData.admin_county}, {postcodeData.region}
              </p>
            </div>
          </div>
        </Card>
      )}

      {showCoverageRadius && postcodeData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Service Radius
            </Label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((miles) => (
                <Button
                  key={miles}
                  size="sm"
                  variant={radius === miles ? "default" : "outline"}
                  onClick={() => handleRadiusChange(miles)}
                  className="text-xs"
                >
                  {miles} miles
                </Button>
              ))}
            </div>
          </div>

          {coverageAreas.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Coverage Areas ({coverageAreas.length} areas within {radius} miles)
              </Label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {coverageAreas.map((area, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs"
                  >
                    {area.area_name} ({area.distance_miles.toFixed(1)}mi)
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your services will be discoverable by customers in these areas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};