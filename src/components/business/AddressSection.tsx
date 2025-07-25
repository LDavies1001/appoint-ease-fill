import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressForm, AddressData } from '@/components/ui/address-form';
import { MapPin, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddressSectionProps {
  data: {
    business_address: AddressData;
  };
  userId: string;
  onUpdate: (data: any) => void;
}

export const AddressSection: React.FC<AddressSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const addressString = [
        editData.business_address.address_line_1,
        editData.business_address.address_line_2,
        editData.business_address.town_city,
        editData.business_address.postcode
      ].filter(Boolean).join(', ');

      // Prepare update data with location metadata
      const updateData: any = {
        business_address: addressString,
        is_address_public: editData.business_address.is_public
      };

      // Add location metadata if available from postcode lookup
      if (editData.business_address.latitude && editData.business_address.longitude) {
        updateData.postcode_latitude = editData.business_address.latitude;
        updateData.postcode_longitude = editData.business_address.longitude;
        updateData.postcode_admin_district = editData.business_address.admin_district;
        updateData.postcode_admin_ward = editData.business_address.admin_ward;
        updateData.postcode_verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('provider_details')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Address updated ✅",
        description: "Your business address has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: "Update failed",
        description: "Could not update business address",
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

  const handleAddressChange = (address: AddressData) => {
    setEditData({ ...editData, business_address: address });
  };

  const formatAddress = (address: AddressData) => {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.town_city,
      address.postcode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-xl">Business Address</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <AddressForm
              value={editData.business_address}
              onChange={handleAddressChange}
            />

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="sm"
                variant="provider"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="font-medium">
                  {formatAddress(data.business_address)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.business_address.is_public 
                    ? "📍 Public address (visible to customers)" 
                    : "🔒 Private address (not visible to customers)"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};