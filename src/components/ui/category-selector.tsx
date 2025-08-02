import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Scissors, Sparkles, Home, ShirtIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
  category_type?: string;
  icon?: React.ReactNode;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  className?: string;
}

const getCategoryIcon = (categoryType: string) => {
  const type = categoryType.toLowerCase();
  if (type.includes('beauty') || type === 'beauty_wellness') {
    return <Sparkles className="h-4 w-4" />;
  }
  if (type.includes('home') || type === 'home_services') {
    return <Home className="h-4 w-4" />;
  }
  if (type.includes('food') || type === 'food_beverage') {
    return <Sparkles className="h-4 w-4" />;
  }
  if (type.includes('health') || type === 'health_fitness') {
    return <Sparkles className="h-4 w-4" />;
  }
  if (type.includes('professional') || type === 'professional_services') {
    return <Scissors className="h-4 w-4" />;
  }
  if (type.includes('automotive')) {
    return <Scissors className="h-4 w-4" />;
  }
  if (type.includes('education') || type === 'education_training') {
    return <Sparkles className="h-4 w-4" />;
  }
  if (type.includes('entertainment')) {
    return <Sparkles className="h-4 w-4" />;
  }
  if (type.includes('retail') || type === 'retail_shopping') {
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for your industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No industries found matching "{searchQuery}"</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredCategories.map((category) => {
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
                  {getCategoryIcon(category.category_type || category.name)}
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
        }))}
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