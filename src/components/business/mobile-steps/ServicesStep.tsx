import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SimpleCategorySelector } from '@/components/ui/simple-category-selector';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X } from 'lucide-react';

interface BusinessCategory {
  id: string;
  name: string;
  category_type: string;
  description: string;
}

interface BusinessProfileData {
  business_categories: string[];
}

interface ServicesStepProps {
  formData: BusinessProfileData;
  onUpdate: (updates: Partial<BusinessProfileData>) => void;
  categories: BusinessCategory[];
}

export const ServicesStep: React.FC<ServicesStepProps> = ({
  formData,
  onUpdate,
  categories
}) => {
  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = formData.business_categories.includes(categoryId);
    const updatedCategories = isSelected
      ? formData.business_categories.filter(id => id !== categoryId)
      : [...formData.business_categories, categoryId];
    
    onUpdate({ business_categories: updatedCategories });
  };

  const removeCategory = (categoryId: string) => {
    onUpdate({
      business_categories: formData.business_categories.filter(id => id !== categoryId)
    });
  };

  const selectedCategories = categories.filter(cat => 
    formData.business_categories.includes(cat.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">What services do you offer?</h3>
            <p className="text-sm text-muted-foreground">
              Select all services that apply to your business. You can choose multiple categories.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Label className="text-base font-medium mb-3 block">
              Selected Services ({selectedCategories.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 pr-1 py-2"
                >
                  {category.name}
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selector */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-base font-medium mb-4 block">
            Available Services
          </Label>
          <SimpleCategorySelector
            categories={categories}
            selectedCategories={formData.business_categories}
            onSelectionChange={(selected) => onUpdate({ business_categories: selected })}
            className="space-y-3"
          />
        </CardContent>
      </Card>

      {/* Requirement Note */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <p className="text-sm text-accent-foreground">
          <strong>Required:</strong> You must select at least one service category to continue.
        </p>
      </div>
    </div>
  );
};