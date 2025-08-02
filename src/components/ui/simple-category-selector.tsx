import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface SubService {
  id: string;
  name: string;
  categoryId: string;
}

interface SimpleCategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  className?: string;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('beauty')) return <Scissors className="h-5 w-5" />;
  if (name.includes('home')) return <Home className="h-5 w-5" />;
  if (name.includes('health') || name.includes('fitness')) return <Dumbbell className="h-5 w-5" />;
  if (name.includes('entertainment')) return <Camera className="h-5 w-5" />;
  if (name.includes('education')) return <GraduationCap className="h-5 w-5" />;
  if (name.includes('professional')) return <Briefcase className="h-5 w-5" />;
  if (name.includes('retail')) return <ShoppingBag className="h-5 w-5" />;
  if (name.includes('automotive')) return <Car className="h-5 w-5" />;
  if (name.includes('food') || name.includes('drink')) return <ChefHat className="h-5 w-5" />;
  return <MoreHorizontal className="h-5 w-5" />;
};

// Predefined sub-services for each category
const subServices: SubService[] = [
  // Beauty
  { id: 'nails', name: 'Nails', categoryId: 'beauty' },
  { id: 'hair', name: 'Hair', categoryId: 'beauty' },
  { id: 'lashes', name: 'Lashes', categoryId: 'beauty' },
  { id: 'brows', name: 'Brows', categoryId: 'beauty' },
  { id: 'facials', name: 'Facials', categoryId: 'beauty' },
  { id: 'makeup', name: 'Makeup', categoryId: 'beauty' },
  { id: 'waxing', name: 'Waxing', categoryId: 'beauty' },
  { id: 'massage', name: 'Massage', categoryId: 'beauty' },

  // Home Services
  { id: 'cleaning', name: 'Cleaning', categoryId: 'home' },
  { id: 'gardening', name: 'Gardening', categoryId: 'home' },
  { id: 'handyman', name: 'Handyman', categoryId: 'home' },
  { id: 'plumbing', name: 'Plumbing', categoryId: 'home' },
  { id: 'electrical', name: 'Electrical', categoryId: 'home' },
  { id: 'painting', name: 'Painting', categoryId: 'home' },
  { id: 'carpentry', name: 'Carpentry', categoryId: 'home' },
  { id: 'pest-control', name: 'Pest Control', categoryId: 'home' },

  // Health & Fitness
  { id: 'personal-training', name: 'Personal Training', categoryId: 'health' },
  { id: 'yoga', name: 'Yoga', categoryId: 'health' },
  { id: 'pilates', name: 'Pilates', categoryId: 'health' },
  { id: 'nutrition', name: 'Nutrition', categoryId: 'health' },
  { id: 'physiotherapy', name: 'Physiotherapy', categoryId: 'health' },
  { id: 'sports-coaching', name: 'Sports Coaching', categoryId: 'health' },
  { id: 'mental-health', name: 'Mental Health', categoryId: 'health' },

  // Entertainment
  { id: 'photography', name: 'Photography', categoryId: 'entertainment' },
  { id: 'videography', name: 'Videography', categoryId: 'entertainment' },
  { id: 'dj-services', name: 'DJ Services', categoryId: 'entertainment' },
  { id: 'live-music', name: 'Live Music', categoryId: 'entertainment' },
  { id: 'party-planning', name: 'Party Planning', categoryId: 'entertainment' },
  { id: 'magic-shows', name: 'Magic Shows', categoryId: 'entertainment' },
  { id: 'face-painting', name: 'Face Painting', categoryId: 'entertainment' },

  // Education
  { id: 'tutoring', name: 'Tutoring', categoryId: 'education' },
  { id: 'music-lessons', name: 'Music Lessons', categoryId: 'education' },
  { id: 'language-teaching', name: 'Language Teaching', categoryId: 'education' },
  { id: 'driving-instruction', name: 'Driving Instruction', categoryId: 'education' },
  { id: 'art-classes', name: 'Art Classes', categoryId: 'education' },
  { id: 'computer-training', name: 'Computer Training', categoryId: 'education' },

  // Professional
  { id: 'legal', name: 'Legal', categoryId: 'professional' },
  { id: 'accounting', name: 'Accounting', categoryId: 'professional' },
  { id: 'consulting', name: 'Consulting', categoryId: 'professional' },
  { id: 'marketing', name: 'Marketing', categoryId: 'professional' },
  { id: 'web-development', name: 'Web Development', categoryId: 'professional' },
  { id: 'graphic-design', name: 'Graphic Design', categoryId: 'professional' },

  // Retail
  { id: 'personal-shopping', name: 'Personal Shopping', categoryId: 'retail' },
  { id: 'styling', name: 'Styling', categoryId: 'retail' },
  { id: 'custom-clothing', name: 'Custom Clothing', categoryId: 'retail' },
  { id: 'jewelry', name: 'Jewelry', categoryId: 'retail' },

  // Automotive
  { id: 'car-repairs', name: 'Car Repairs', categoryId: 'automotive' },
  { id: 'mot-testing', name: 'MOT Testing', categoryId: 'automotive' },
  { id: 'car-detailing', name: 'Car Detailing', categoryId: 'automotive' },
  { id: 'tire-fitting', name: 'Tire Fitting', categoryId: 'automotive' },

  // Food & Drink
  { id: 'catering', name: 'Catering', categoryId: 'food' },
  { id: 'private-chef', name: 'Private Chef', categoryId: 'food' },
  { id: 'baking', name: 'Baking', categoryId: 'food' },
  { id: 'bartending', name: 'Bartending', categoryId: 'food' },

  // Other
  { id: 'pet-services', name: 'Pet Services', categoryId: 'other' },
  { id: 'childcare', name: 'Childcare', categoryId: 'other' },
  { id: 'eldercare', name: 'Eldercare', categoryId: 'other' },
  { id: 'moving', name: 'Moving', categoryId: 'other' },
];

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections = 3,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Map database categories to our predefined structure
  const categoryMapping: Record<string, string> = {
    'Beauty': 'beauty',
    'Home Services': 'home',
    'Health & Fitness': 'health',
    'Entertainment': 'entertainment',
    'Education': 'education',
    'Professional': 'professional',
    'Retail': 'retail',
    'Automotive': 'automotive',
    'Food & Drink': 'food',
    'Other': 'other'
  };

  const availableCategories = categories.filter(cat => categoryMapping[cat.name]);

  // Filter categories and services based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return availableCategories;
    return availableCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subServices.some(service => 
        service.categoryId === categoryMapping[category.name] &&
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [availableCategories, searchQuery]);

  const getServicesForCategory = (categoryName: string) => {
    const categoryKey = categoryMapping[categoryName];
    return subServices.filter(service => service.categoryId === categoryKey);
  };

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (selectedMainCategory === categoryId) {
      // If clicking the same category, close it
      setSelectedMainCategory(null);
      setSelectedServices([]);
    } else {
      // Open new category
      setSelectedMainCategory(categoryId);
      setSelectedServices([]);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newSelected);
  };

  const handleConfirmSelection = () => {
    // For now, we'll store the main category ID in the database
    // In a real app, you might want to store the specific services
    if (selectedMainCategory && selectedServices.length > 0) {
      const newSelection = selectedCategories.includes(selectedMainCategory)
        ? selectedCategories
        : [...selectedCategories, selectedMainCategory];
      
      if (newSelection.length <= maxSelections) {
        onSelectionChange(newSelection);
      }
    }
    setSelectedMainCategory(null);
    setSelectedServices([]);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
    setSelectedMainCategory(null);
    setSelectedServices([]);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Select up to {maxSelections} main service categories for your business.
          </p>
          <p className="text-lg font-medium text-accent">
            {selectedCategories.length} of {maxSelections} selected
          </p>
        </div>
        {selectedCategories.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search categories or services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Categories:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <Badge key={categoryId} variant="default" className="flex items-center gap-1">
                  {getCategoryIcon(category.name)}
                  {category.name}
                  <button
                    onClick={() => onSelectionChange(selectedCategories.filter(id => id !== categoryId))}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isExpanded = selectedMainCategory === category.id;
          const services = getServicesForCategory(category.name);
          const canSelect = !isSelected && selectedCategories.length < maxSelections;

          return (
            <div key={category.id} className="space-y-3">
              {/* Main category card */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  {
                    "border-accent bg-accent/10": isSelected,
                    "border-primary bg-primary/10": isExpanded && !isSelected,
                    "border-muted hover:border-accent/50": !isSelected && !isExpanded && canSelect,
                    "border-muted opacity-50 cursor-not-allowed": !canSelect && !isSelected,
                  }
                )}
                onClick={() => canSelect || isSelected ? handleCategoryClick(category.id, category.name) : undefined}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    {getCategoryIcon(category.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  )}
                </div>
              </div>

              {/* Services selection */}
              {isExpanded && (
                <div className="ml-4 p-4 border rounded-lg bg-muted/30 animate-fade-in">
                  <p className="text-sm font-medium mb-3">Select specific services you offer:</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                        <label
                          htmlFor={service.id}
                          className="text-sm cursor-pointer hover:text-accent"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleConfirmSelection}
                      disabled={selectedServices.length === 0}
                    >
                      Add Category
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedMainCategory(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No categories found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Selection limit message */}
      {selectedCategories.length >= maxSelections && (
        <div className="text-center bg-accent/10 rounded-lg p-4 border border-accent/20">
          <p className="text-sm text-accent font-medium">
            Maximum categories selected. Remove one to select a different category.
          </p>
        </div>
      )}
    </div>
  );
};
