import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PostcodeLookup } from '@/components/ui/postcode-lookup';
import { Building, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessInfoSectionProps {
  data: {
    business_name: string;
    business_description: string;
    years_experience: number;
    service_area: string;
  };
  userId: string;
  onUpdate: (data: any) => void;
}

export const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [serviceRadius, setServiceRadius] = useState<number | null>(null);
  const [nearbyTowns, setNearbyTowns] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        business_name: editData.business_name,
        business_description: editData.business_description,
        years_experience: editData.years_experience,
        service_area: editData.service_area
      };

      // Add radius and nearby towns if they exist
      if (serviceRadius !== null) {
        updateData.service_radius_miles = serviceRadius;
      }
      if (nearbyTowns.length > 0) {
        updateData.nearby_towns = nearbyTowns;
      }

      const { error } = await supabase
        .from('provider_details')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Business Info updated ✅",
        description: "Your business information has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating business info:', error);
      toast({
        title: "Update failed",
        description: "Could not update business information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
    setServiceRadius(null);
    setNearbyTowns([]);
  };

  const handleServiceAreaUpdate = (radius: number, towns: string[]) => {
    setServiceRadius(radius);
    setNearbyTowns(towns);
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Business Information</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={editData.business_name || ''}
                onChange={(e) => setEditData({ ...editData, business_name: e.target.value })}
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_description">Description</Label>
              <Textarea
                id="business_description"
                value={editData.business_description || ''}
                onChange={(e) => setEditData({ ...editData, business_description: e.target.value })}
                placeholder="Describe your business and services"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={editData.years_experience || ''}
                  onChange={(e) => setEditData({ ...editData, years_experience: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <PostcodeLookup
                  value={editData.service_area || ''}
                  onChange={(value) => setEditData({ ...editData, service_area: value })}
                  onLocationFound={(location) => {
                    // Location areas will be automatically set by the component
                  }}
                  onServiceAreaUpdate={handleServiceAreaUpdate}
                  placeholder="Enter your service area postcode or street"
                  className="w-full"
                />
              </div>
            </div>

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
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {data.business_name || 'Business name not set'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {data.business_description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{data.years_experience || 0} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Area</p>
                <p className="font-medium">{data.service_area || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};