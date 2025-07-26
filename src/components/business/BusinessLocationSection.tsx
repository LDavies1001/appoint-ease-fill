import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, Check, X, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessLocationData {
  business_address: string;
  business_street: string;
  business_city: string;
  business_county: string;
  business_postcode: string;
  business_country: string;
  is_address_public: boolean;
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
  const { toast } = useToast();

  const handleAddressChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFullAddressChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      business_address: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        business_address: editData.business_address,
        business_street: editData.business_street,
        business_city: editData.business_city,
        business_county: editData.business_county,
        business_postcode: editData.business_postcode,
        business_country: editData.business_country,
        is_address_public: editData.is_address_public
      };

      const { error } = await supabase
        .from('provider_details')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      
      toast({
        title: "Address saved successfully",
        description: "Your business address has been updated",
        variant: "default"
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
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const formatAddress = (address: string) => {
    return address || 'No address provided';
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg border-l-4 border-l-green-500">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">Business Address</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-8 w-8 p-0 hover:bg-green-100"
          >
            <Edit className="h-4 w-4 text-green-600" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* Structured Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="business-street" className="text-green-800 font-medium">
                  Street Address
                </Label>
                <Input
                  id="business-street"
                  value={editData.business_street}
                  onChange={(e) => handleAddressChange('business_street', e.target.value)}
                  placeholder="e.g., 21 Chorlton Road"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="business-city" className="text-green-800 font-medium">
                  City/Town
                </Label>
                <Input
                  id="business-city"
                  value={editData.business_city}
                  onChange={(e) => handleAddressChange('business_city', e.target.value)}
                  placeholder="e.g., Manchester"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="business-county" className="text-green-800 font-medium">
                  County/State
                </Label>
                <Input
                  id="business-county"
                  value={editData.business_county}
                  onChange={(e) => handleAddressChange('business_county', e.target.value)}
                  placeholder="e.g., Greater Manchester"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="business-postcode" className="text-green-800 font-medium">
                  Postcode
                </Label>
                <Input
                  id="business-postcode"
                  value={editData.business_postcode}
                  onChange={(e) => handleAddressChange('business_postcode', e.target.value)}
                  placeholder="e.g., M23 9NY"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="business-country" className="text-green-800 font-medium">
                  Country
                </Label>
                <Input
                  id="business-country"
                  value={editData.business_country}
                  onChange={(e) => handleAddressChange('business_country', e.target.value)}
                  placeholder="e.g., United Kingdom"
                />
              </div>
            </div>

            {/* Address Privacy Settings */}
            <div className="space-y-3">
              <Label className="text-green-800 font-medium">Address Visibility</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="address-public"
                    name="address-visibility"
                    checked={editData.is_address_public}
                    onChange={() => setEditData(prev => ({ ...prev, is_address_public: true }))}
                    className="w-4 h-4 text-green-600"
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
                    className="w-4 h-4 text-green-600"
                  />
                  <Label htmlFor="address-private" className="text-sm">
                    🔒 Keep address private (recommended - share only area/town)
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Address
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
                className="border-green-300 hover:bg-green-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Address Display */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Home className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="font-medium">
                    {formatAddress(data.business_address)}
                  </p>
                  
                  {/* Structured address display */}
                  {(data.business_street || data.business_city || data.business_county || data.business_postcode || data.business_country) && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      {data.business_street && <p>📍 {data.business_street}</p>}
                      {data.business_city && <p>🏙️ {data.business_city}</p>}
                      {data.business_county && <p>🗺️ {data.business_county}</p>}
                      {data.business_postcode && <p>📮 {data.business_postcode}</p>}
                      {data.business_country && <p>🌍 {data.business_country}</p>}
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {data.is_address_public 
                      ? "📍 Public address (visible to customers)" 
                      : "🔒 Private address (area only visible to customers)"
                    }
                  </p>
                </div>
              </div>

            {(!data.business_address && !data.business_street && !data.business_city) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Add your business address to help customers find you.
                </p>
              </div>
            )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};