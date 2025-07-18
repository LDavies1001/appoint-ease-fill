import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  placeholder = "Enter location",
  className,
  value,
  onChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get readable address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location details');
          }
          
          const data = await response.json();
          
          // Extract the most specific locality from the address
          const address = data.address || {};
          const location = address.suburb ||           // Prioritize suburb (like Farnworth, Hazel Grove)
                          address.village ||          // Village names 
                          address.town ||             // Town names
                          address.district ||         // District names
                          address.borough ||          // Borough names
                          address.city_district ||    // City district
                          address.neighbourhood ||    // Neighbourhood names
                          address.hamlet ||           // Small settlements
                          address.city ||             // Fallback to city
                          data.display_name?.split(',')[0] || 
                          'Unknown location';
          
          setInputValue(location);
          onChange?.(location);
          
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Failed to get location details. Please enter your location manually.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out.');
            break;
          default:
            alert('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className={cn("pl-10 pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-primary/10"
        onClick={getCurrentLocation}
        disabled={isLoading}
        title="Use my current location"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 text-primary" />
        )}
      </Button>
    </div>
  );
};