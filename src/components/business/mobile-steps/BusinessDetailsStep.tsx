import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AddressLookup } from '@/components/ui/address-lookup';
import { AddressData } from '@/components/ui/address-form';
import { ImageCropUpload } from '@/components/ui/image-crop-upload';
import { Building, Phone, MapPin, Upload, Edit3, Check, X } from 'lucide-react';

interface BusinessProfileData {
  business_name: string;
  business_phone: string;
  business_address: AddressData;
  business_logo_url: string;
}

interface BusinessDetailsStepProps {
  formData: BusinessProfileData;
  onUpdate: (updates: Partial<BusinessProfileData>) => void;
}

export const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({
  formData,
  onUpdate
}) => {
  const [isEditingAddress, setIsEditingAddress] = useState(!formData.business_address.address_line_1);

  return (
    <div className="space-y-6">
      {/* Business Logo */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto">
              <ImageCropUpload
                onUpload={(url) => onUpdate({ business_logo_url: url })}
                bucket="business-logos"
                aspectRatio={1}
                className="w-full h-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Business Logo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a square logo for your business
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Name */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <Label htmlFor="business-name" className="text-base font-medium">
                Business Name *
              </Label>
            </div>
            <Input
              id="business-name"
              value={formData.business_name}
              onChange={(e) => onUpdate({ business_name: e.target.value })}
              placeholder="Enter your business name"
              className="text-base h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phone Number */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <Label htmlFor="business-phone" className="text-base font-medium">
                Business Phone *
              </Label>
            </div>
            <Input
              id="business-phone"
              type="tel"
              value={formData.business_phone}
              onChange={(e) => onUpdate({ business_phone: e.target.value })}
              placeholder="Enter your business phone number"
              className="text-base h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Business Address *
              </Label>
            </div>
            <div className="space-y-3">
              {isEditingAddress ? (
                <>
                  <AddressLookup
                    value={formData.business_address}
                    onChange={(address) => {
                      onUpdate({ business_address: address });
                      if (address.address_line_1) {
                        setIsEditingAddress(false);
                      }
                    }}
                    className="text-base"
                  />
                  {formData.business_address.address_line_1 && (
                    <div className="flex gap-2">
                      <Button
                        variant="business"
                        size="sm"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Address
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {formData.business_address.address_line_1 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          {formData.business_address.address_line_1}
                        </p>
                        {formData.business_address.address_line_2 && (
                          <p className="text-sm text-muted-foreground">
                            {formData.business_address.address_line_2}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {[
                            formData.business_address.town_city,
                            formData.business_address.postcode
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingAddress(true)}
                        className="w-full"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Address
                      </Button>
                    </div>
                  ) : (
                    <AddressLookup
                      value={formData.business_address}
                      onChange={(address) => onUpdate({ business_address: address })}
                      className="text-base"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};