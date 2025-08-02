import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  CheckCircle, 
  Scissors, 
  Home, 
  Dumbbell, 
  Camera, 
  GraduationCap, 
  Briefcase, 
  ShoppingBag, 
  Car, 
  ChefHat, 
  MoreHorizontal,
  X,
  TrendingUp,
  Star,
  MapPin,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CategoryGroup {
  id: string;
  name: string;
  categories: Category[];
  defaultOpen?: boolean;
}

interface EnhancedCategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  className?: string;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('beauty') || name.includes('treatment')) {
    return <Scissors className="h-5 w-5" />;
  }
  if (name.includes('cleaning') || name.includes('home') || name.includes('maintenance')) {
    return <Home className="h-5 w-5" />;
  }
  if (name.includes('health') || name.includes('fitness')) {
    return <Dumbbell className="h-5 w-5" />;
  }
  if (name.includes('entertainment') || name.includes('event')) {
    return <Camera className="h-5 w-5" />;
  }
  if (name.includes('education') || name.includes('training')) {
    return <GraduationCap className="h-5 w-5" />;
  }
  if (name.includes('professional') || name.includes('service')) {
    return <Briefcase className="h-5 w-5" />;
  }
  if (name.includes('retail') || name.includes('shopping')) {
    return <ShoppingBag className="h-5 w-5" />;
  }
  if (name.includes('automotive')) {
    return <Car className="h-5 w-5" />;
  }
  if (name.includes('food') || name.includes('beverage')) {
    return <ChefHat className="h-5 w-5" />;
  }
  return <MoreHorizontal className="h-5 w-5" />;
};

const getCategoryGlow = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('beauty') || name.includes('treatment')) {
    return 'shadow-pink-200/50 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50';
  }
  if (name.includes('cleaning') || name.includes('home') || name.includes('maintenance')) {
    return 'shadow-green-200/50 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50';
  }
  if (name.includes('health') || name.includes('fitness')) {
    return 'shadow-blue-200/50 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50';
  }
  if (name.includes('entertainment') || name.includes('event')) {
    return 'shadow-purple-200/50 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50';
  }
  if (name.includes('education') || name.includes('training')) {
    return 'shadow-orange-200/50 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50';
  }
  if (name.includes('professional') || name.includes('service')) {
    return 'shadow-indigo-200/50 border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50';
  }
  if (name.includes('retail') || name.includes('shopping')) {
    return 'shadow-teal-200/50 border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50';
  }
  if (name.includes('automotive')) {
    return 'shadow-gray-200/50 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50';
  }
  if (name.includes('food') || name.includes('beverage')) {
    return 'shadow-yellow-200/50 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50';
  }
  return 'shadow-gray-200/50 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50';
};

export const EnhancedCategorySelector: React.FC<EnhancedCategorySelectorProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections = 3,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Group categories
  const categoryGroups: CategoryGroup[] = useMemo(() => [
    {
      id: 'personal-care',
      name: 'Personal Care',
      categories: categories.filter(cat => 
        cat.name.includes('Beauty') || cat.name.includes('Health & Fitness')
      ),
      defaultOpen: true
    },
    {
      id: 'home-lifestyle',
      name: 'Home & Lifestyle',
      categories: categories.filter(cat => 
        cat.name.includes('Cleaning') || cat.name.includes('Food & Beverage')
      )
    },
    {
      id: 'events-education',
      name: 'Events & Education',
      categories: categories.filter(cat => 
        cat.name.includes('Entertainment') || cat.name.includes('Education')
      )
    },
    {
      id: 'business-admin',
      name: 'Business & Admin',
      categories: categories.filter(cat => 
        cat.name.includes('Professional') || cat.name.includes('Retail')
      )
    },
    {
      id: 'other',
      name: 'Other',
      categories: categories.filter(cat => 
        cat.name.includes('Automotive') || cat.name.includes('Niche')
      )
    }
  ], [categories]);

  // Filter categories based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return categoryGroups;
    
    return categoryGroups.map(group => ({
      ...group,
      categories: group.categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.categories.length > 0);
  }, [categoryGroups, searchQuery]);

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      if (selectedCategories.length < maxSelections) {
        onSelectionChange([...selectedCategories, categoryId]);
      }
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const filterChips = [
    { id: 'popular', label: 'Popular', icon: <TrendingUp className="h-3 w-3" /> },
    { id: 'new', label: 'New', icon: <Sparkles className="h-3 w-3" /> },
    { id: 'most-booked', label: 'Most Booked', icon: <Star className="h-3 w-3" /> },
    { id: 'local-demand', label: 'Local Demand', icon: <MapPin className="h-3 w-3" /> }
  ];

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header with counter and clear button */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Select the services you provide. Choose up to {maxSelections}.
            </p>
            <p className="text-lg font-medium text-accent">
              You've selected {selectedCategories.length} of {maxSelections} services
            </p>
          </div>
          {selectedCategories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for services (e.g., 'lashes', 'cleaning', 'photography')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <Button
              key={chip.id}
              variant={activeFilter === chip.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
              className="text-xs h-7"
            >
              {chip.icon}
              <span className="ml-1">{chip.label}</span>
            </Button>
          ))}
        </div>

        {/* Category groups with accordion */}
        <Accordion 
          type="multiple" 
          defaultValue={categoryGroups.filter(g => g.defaultOpen).map(g => g.id)}
          className="space-y-4"
        >
          {filteredGroups.map((group) => (
            <AccordionItem 
              key={group.id} 
              value={group.id}
              className="border rounded-lg px-6 py-2"
            >
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <span>{group.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {group.categories.length} {group.categories.length === 1 ? 'service' : 'services'}
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="space-y-3 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    const isDisabled = !isSelected && selectedCategories.length >= maxSelections;

                    return (
                      <TooltipProvider key={category.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleCategoryToggle(category.id)}
                              disabled={isDisabled}
                              className={cn(
                                "h-auto p-4 justify-start text-left transition-all duration-300 hover:scale-[1.02] relative",
                                {
                                  [`${getCategoryGlow(category.name)} shadow-lg`]: isSelected,
                                  "opacity-50 cursor-not-allowed": isDisabled,
                                  "hover:border-accent/50 hover:shadow-md": !isSelected && !isDisabled,
                                }
                              )}
                            >
                              <div className="flex items-center space-x-3 w-full">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all duration-300",
                                  {
                                    "bg-white/30 text-accent": isSelected,
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
                                      isSelected ? "text-accent/80" : "text-muted-foreground"
                                    )}>
                                      {category.description}
                                    </p>
                                  )}
                                </div>

                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-accent animate-scale-in" />
                                )}
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              <strong>{category.name}</strong>
                              {category.description && (
                                <>
                                  <br />
                                  <span className="text-muted-foreground">{category.description}</span>
                                </>
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* No results message */}
        {filteredGroups.length === 0 && searchQuery && (
          <div className="text-center py-12 space-y-3">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No services found matching "{searchQuery}"</p>
              <p className="text-sm">Try a different search term or browse categories above</p>
            </div>
          </div>
        )}

        {/* Selection limit message */}
        {selectedCategories.length >= maxSelections && (
          <div className="text-center bg-accent/10 rounded-lg p-4 border border-accent/20">
            <p className="text-sm text-accent font-medium">
              Maximum services selected. Deselect one to choose a different service.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};