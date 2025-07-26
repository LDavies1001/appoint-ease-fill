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
  is_address_public: boolean;
  postcode_full: string | null;
  postcode_area: string | null;
  coverage_towns: string[];
}

interface BusinessLocationSectionProps {
  data: BusinessLocationData;
  userId: string;
  onUpdate: (data: Partial<BusinessLocationData>) => void;
}

// Static mapping of postcode areas to nearby towns (5-mile radius examples)
const POSTCODE_AREA_MAPPING: Record<string, string[]> = {
  'M23': ['Wythenshawe', 'Baguley', 'Timperley', 'Brooklands', 'Northenden', 'Sale'],
  'M22': ['Wythenshawe', 'Baguley', 'Northenden', 'Didsbury', 'Heald Green'],
  'M21': ['Chorlton', 'Didsbury', 'Fallowfield', 'Withington', 'West Didsbury'],
  'M20': ['Didsbury', 'Withington', 'Burnage', 'Fallowfield', 'Chorlton'],
  'M19': ['Levenshulme', 'Burnage', 'Heaton Chapel', 'Stockport', 'Didsbury'],
  'M14': ['Fallowfield', 'Moss Side', 'Rusholme', 'Withington', 'Chorlton'],
  'M15': ['Hulme', 'Moss Side', 'Chorlton', 'Old Trafford', 'Stretford'],
  'M16': ['Old Trafford', 'Firswood', 'Stretford', 'Chorlton', 'Sale'],
  'M33': ['Sale', 'Timperley', 'Altrincham', 'Brooklands', 'Ashton upon Mersey'],
  'WA14': ['Altrincham', 'Timperley', 'Hale', 'Sale', 'Bowdon'],
  'WA15': ['Hale', 'Altrincham', 'Bowdon', 'Ashley', 'Mobberley'],
  'SK8': ['Cheadle', 'Gatley', 'Heald Green', 'Cheadle Hulme', 'Bramhall'],
  'SK7': ['Bramhall', 'Cheadle Hulme', 'Hazel Grove', 'Poynton', 'Woodford'],
  'SK4': ['Stockport', 'Heaton Chapel', 'Heaton Moor', 'Heaton Mersey', 'Burnage'],
  'SK3': ['Stockport', 'Edgeley', 'Cheadle Heath', 'Davenport', 'Adswood'],
  'SK2': ['Stockport', 'Romiley', 'Bredbury', 'Woodley', 'Marple'],
  'SK1': ['Stockport', 'Heaviley', 'Shaw Heath', 'Portwood', 'Edgeley'],
  'SK6': ['Marple', 'Romiley', 'Bredbury', 'Compstall', 'Mellor'],
  'OL1': ['Oldham', 'Chadderton', 'Derker', 'Hollinwood', 'Werneth'],
  'OL2': ['Oldham', 'Shaw', 'Royton', 'Chadderton', 'Crompton'],
  'BL1': ['Bolton', 'Chorley New Road', 'Heaton', 'Lostock', 'Markland Hill'],
  'BL2': ['Bolton', 'Smithills', 'Halliwell', 'Heaton', 'Astley Bridge'],
  'BL3': ['Bolton', 'Breightmet', 'Tonge Moor', 'Harwood', 'Ainsworth'],
  'WN1': ['Wigan', 'Scholes', 'Swinley', 'Whelley', 'Marsh Green'],
  'WN2': ['Wigan', 'Ince', 'Lower Ince', 'Rose Bridge', 'Platt Bridge'],
  'L1': ['Liverpool City Centre', 'Vauxhall', 'Everton', 'Kirkdale', 'Bootle'],
  'L2': ['Liverpool City Centre', 'Vauxhall', 'Everton', 'Scotland Road', 'Kirkdale'],
  'L8': ['Toxteth', 'Dingle', 'Canning', 'Edge Hill', 'Sefton Park'],
  'L15': ['Wavertree', 'Edge Hill', 'Smithdown', 'Picton', 'Childwall'],
  'L18': ['Allerton', 'Mossley Hill', 'Woolton', 'Childwall', 'Gateacre'],
  'PR1': ['Preston', 'Fulwood', 'Ribbleton', 'Ashton', 'Ingol'],
  'PR2': ['Preston', 'Fulwood', 'Lea', 'Cottam', 'Ingol'],
  'BB1': ['Blackburn', 'Mill Hill', 'Bastwell', 'Audley', 'Little Harwood'],
  'BB2': ['Blackburn', 'Ewood', 'Fernhurst', 'Roe Lee', 'Pleasington'],
};

// UK Postcode regex pattern
const UK_POSTCODE_REGEX = /([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})/i;

export const BusinessLocationSection: React.FC<BusinessLocationSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [addressInput, setAddressInput] = useState(data.business_address || '');
  const [hasValidPostcode, setHasValidPostcode] = useState(false);
  const { toast } = useToast();

  // Extract and validate postcode from address
  const extractAndValidatePostcode = (address: string) => {
    const match = address.match(UK_POSTCODE_REGEX);
    if (!match) {
      setHasValidPostcode(false);
      return null;
    }

    const fullPostcode = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
    const postcodeArea = fullPostcode.split(' ')[0]; // e.g., "M23" from "M23 9NY"
    
    setHasValidPostcode(true);
    return { fullPostcode, postcodeArea };
  };

  // Get coverage towns for a postcode area
  const getCoverageTowns = (postcodeArea: string): string[] => {
    return POSTCODE_AREA_MAPPING[postcodeArea] || [];
  };

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    
    const postcodeData = extractAndValidatePostcode(value);
    
    if (postcodeData) {
      const coverageTowns = getCoverageTowns(postcodeData.postcodeArea);
      
      setEditData(prev => ({
        ...prev,
        business_address: value,
        postcode_full: postcodeData.fullPostcode,
        postcode_area: postcodeData.postcodeArea,
        coverage_towns: coverageTowns
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        business_address: value,
        postcode_full: null,
        postcode_area: null,
        coverage_towns: []
      }));
    }
  };

  const handleSave = async () => {
    if (!hasValidPostcode) {
      toast({
        title: "Invalid address",
        description: "Please include a valid UK postcode in your address (e.g., M23 9NY)",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        business_address: editData.business_address,
        is_address_public: editData.is_address_public,
        postcode_full: editData.postcode_full,
        postcode_area: editData.postcode_area,
        coverage_towns: editData.coverage_towns,
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
        title: "✅ Address saved successfully",
        description: `You're now matched with nearby customers in: ${editData.coverage_towns.slice(0, 3).join(', ')}${editData.coverage_towns.length > 3 ? '...' : ''}`,
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
    setAddressInput(data.business_address || '');
    setHasValidPostcode(!!data.postcode_full);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setAddressInput(data.business_address || '');
    extractAndValidatePostcode(data.business_address || '');
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
          <CardTitle className="text-xl text-green-800">Business Address & Matching Area</CardTitle>
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
            {/* Manual Address Input */}
            <div className="space-y-3">
              <Label htmlFor="business-address" className="text-green-800 font-medium">
                Business Address (Required) <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter your full business address including a valid UK postcode
              </p>
              
              <div className="relative">
                <Input
                  id="business-address"
                  value={addressInput}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="e.g., 21 Chorlton Road, Wythenshawe, M23 9NY"
                  className={`pr-10 ${hasValidPostcode ? 'border-green-500 focus:border-green-600' : 'border-destructive focus:border-destructive'}`}
                />
                
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {hasValidPostcode ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>

              {!hasValidPostcode && addressInput && (
                <p className="text-sm text-destructive">
                  ⚠️ Please include a valid UK postcode (e.g., M23 9NY, L1 8JQ, SK1 3XE)
                </p>
              )}
            </div>

            {/* Coverage Areas Preview */}
            {hasValidPostcode && editData.coverage_towns.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Coverage Areas:</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editData.coverage_towns.map((town, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-green-100 text-green-800 text-xs border-green-200"
                    >
                      {town}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-green-700">
                  ✅ You will be visible to customers in these areas (Postcode: {editData.postcode_area})
                </p>
              </div>
            )}

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
                disabled={saving || !hasValidPostcode}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Address & Activate Matching
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
                {data.postcode_area && (
                  <p className="text-sm text-green-600 mt-1">
                    Postcode Area: {data.postcode_area}
                  </p>
                )}
              </div>
            </div>

            {/* Coverage Areas */}
            {data.coverage_towns.length > 0 && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">
                    Customer Matching Areas:
                  </p>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {data.coverage_towns.slice(0, 6).map((town, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-100 text-green-800 text-xs border-green-200"
                        >
                          {town}
                        </Badge>
                      ))}
                      {data.coverage_towns.length > 6 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs border-green-200">
                          +{data.coverage_towns.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!data.business_address && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Required:</strong> Add your business address to activate customer matching and become discoverable in your area.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};