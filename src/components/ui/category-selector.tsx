import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Scissors, Sparkles, Home, ShirtIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  className?: string;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('nail') || name.includes('manicure')) {
    return <Sparkles className="h-4 w-4" />;
  }
  if (name.includes('lash') || name.includes('brow') || name.includes('beauty')) {
    return <Scissors className="h-4 w-4" />;
  }
  if (name.includes('clean') || name.includes('domestic')) {
    return <Home className="h-4 w-4" />;
  }
  if (name.includes('cloth') || name.includes('laundry')) {
    return <ShirtIcon className="h-4 w-4" />;
  }
  return <Sparkles className="h-4 w-4" />;
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections = 3,
  className
}) => {
  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      // Remove category
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add category if under limit
      if (selectedCategories.length < maxSelections) {
        onSelectionChange([...selectedCategories, categoryId]);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select the services you provide. You can choose up to {maxSelections}.
        </p>
        <Badge variant="outline" className="text-xs">
          {selectedCategories.length}/{maxSelections}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isDisabled = !isSelected && selectedCategories.length >= maxSelections;

          return (
            <Button
              key={category.id}
              type="button"
              variant="outline"
              onClick={() => handleCategoryToggle(category.id)}
              disabled={isDisabled}
              className={cn(
                "h-auto p-4 justify-start text-left transition-all duration-200 hover:scale-[1.02]",
                {
                  "bg-accent border-accent text-white hover:bg-accent/90 shadow-lg": isSelected,
                  "opacity-50 cursor-not-allowed": isDisabled,
                  "hover:border-accent/50": !isSelected && !isDisabled,
                }
              )}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={cn(
                  "p-2 rounded-lg transition-colors duration-200",
                  {
                    "bg-white/20 text-white": isSelected,
                    "bg-muted text-muted-foreground": !isSelected,
                  }
                )}>
                  {getCategoryIcon(category.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{category.name}</h4>
                  {category.description && (
                    <p className={cn(
                      "text-xs mt-1 line-clamp-2",
                      isSelected ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedCategories.length >= maxSelections && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Maximum categories selected. Deselect one to choose a different service.
          </p>
        </div>
      )}
    </div>
  );
};