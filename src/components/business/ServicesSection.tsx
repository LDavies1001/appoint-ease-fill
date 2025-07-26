import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CategorySelector } from '@/components/ui/category-selector';
import { Building, Edit2, Save, X } from 'lucide-react';

interface ServicesData {
  services_offered: string[];
  business_categories: any[];
  pricing_info: string;
}

interface ServicesSectionProps {
  data: ServicesData;
  userId: string;
  onUpdate: (updatedData: Partial<ServicesData>) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  const fetchCategories = async () => {
    try {
      const { data: categories, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllCategories(categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({
          services_offered: editData.services_offered,
          pricing_info: editData.pricing_info
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update business categories based on selected services
      const updatedCategories = editData.services_offered.map(serviceId => 
        allCategories.find(cat => cat.id === serviceId)
      ).filter(Boolean);

      onUpdate({
        services_offered: editData.services_offered,
        pricing_info: editData.pricing_info,
        business_categories: updatedCategories
      });

      setIsEditing(false);
      toast({
        title: "Services updated",
        description: "Your business services have been updated successfully"
      });
    } catch (error) {
      console.error('Error updating services:', error);
      toast({
        title: "Update failed",
        description: "Could not update your services. Please try again.",
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

  const handleCategoryChange = (selectedCategories: string[]) => {
    setEditData(prev => ({
      ...prev,
      services_offered: selectedCategories
    }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Building className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-xl font-semibold">Services Offered</h3>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Business Categories</Label>
            <CategorySelector
              categories={allCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                description: cat.description
              }))}
              selectedCategories={editData.services_offered}
              onSelectionChange={handleCategoryChange}
              maxSelections={5}
            />
          </div>

          <div>
            <Label htmlFor="pricing_info" className="text-base font-medium">
              Pricing Information
            </Label>
            <Textarea
              id="pricing_info"
              value={editData.pricing_info}
              onChange={(e) => setEditData(prev => ({ ...prev, pricing_info: e.target.value }))}
              placeholder="Describe your pricing structure, rates, packages, etc."
              className="mt-2"
              rows={4}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Selected Services</h4>
            {data.business_categories && data.business_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.business_categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {category.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No services selected</p>
            )}
          </div>

          {data.pricing_info && (
            <div>
              <h4 className="font-medium mb-2">Pricing Information</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.pricing_info}</p>
            </div>
          )}

          {!data.pricing_info && (
            <div>
              <h4 className="font-medium mb-2">Pricing Information</h4>
              <p className="text-sm text-muted-foreground">No pricing information provided</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};