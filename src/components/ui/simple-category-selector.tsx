import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Scissors, 
  Sparkles, 
  Wrench,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ServiceGroup {
  id: string;
  name: string;
  services: string[];
}

interface SimpleCategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  className?: string;
}

// Main categories
const mainCategories = [
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    icon: Scissors,
    emoji: '💅'
  },
  {
    id: 'cleaning',
    name: 'Cleaning Services', 
    icon: Sparkles,
    emoji: '🧼'
  },
  {
    id: 'home',
    name: 'Home & Handy Services',
    icon: Wrench,
    emoji: '🛠️'
  }
];

// Service groups for each category
const serviceGroups: Record<string, ServiceGroup[]> = {
  beauty: [
    {
      id: 'brows-lashes',
      name: 'Brows & Lashes',
      services: [
        'Eyebrow Waxing',
        'Threading', 
        'Tinting',
        'Brow Lamination',
        'Lash Lift',
        'Classic Lashes',
        'Hybrid Lashes',
        'Volume Lashes',
        'Lash Removal'
      ]
    },
    {
      id: 'nails',
      name: 'Nails',
      services: [
        'Manicure',
        'Gel Nails',
        'Acrylic Nails',
        'BIAB',
        'Pedicure',
        'Nail Art',
        'Nail Removal',
        'Callus Peel'
      ]
    },
    {
      id: 'hair',
      name: 'Hair',
      services: [
        'Dry Cut',
        'Wash & Blow Dry',
        'Hair Colour',
        'Highlights',
        'Balayage',
        'Hair Up / Occasion Styling',
        'Hair Extensions',
        'Hair Treatments'
      ]
    },
    {
      id: 'facials-skin',
      name: 'Facials & Skin',
      services: [
        'Express Facial',
        'Luxury Facial',
        'Dermaplaning',
        'Chemical Peel',
        'Microdermabrasion',
        'LED Therapy'
      ]
    },
    {
      id: 'waxing-hair-removal',
      name: 'Waxing & Hair Removal',
      services: [
        'Leg Wax',
        'Bikini / Hollywood',
        'Underarm Wax',
        'Arm / Face Wax',
        'Chin / Lip Wax'
      ]
    },
    {
      id: 'tanning',
      name: 'Tanning',
      services: [
        'Light Spray Tan',
        'Medium / Dark Spray Tan',
        'Tanning Booth'
      ]
    },
    {
      id: 'massage-body',
      name: 'Massage & Body',
      services: [
        'Back & Shoulder Massage',
        'Full Body Massage',
        'Hot Stone Massage',
        'Pregnancy Massage',
        'Indian Head Massage'
      ]
    }
  ],
  cleaning: [
    {
      id: 'domestic-cleaning',
      name: 'Domestic Cleaning',
      services: [
        'Regular Clean',
        'Deep Clean',
        'End-of-Tenancy',
        'Post-Party Clean',
        'Airbnb Turnaround',
        'Spring Clean'
      ]
    },
    {
      id: 'commercial-cleaning',
      name: 'Commercial Cleaning',
      services: [
        'Office Cleaning',
        'Shop Cleaning',
        'Salon / Clinic Cleaning',
        'Restaurant / Kitchen Cleaning',
        'Commercial End-of-Tenancy'
      ]
    },
    {
      id: 'specialist-cleaning',
      name: 'Specialist Cleaning',
      services: [
        'Oven Cleaning',
        'Carpet Cleaning',
        'Upholstery Cleaning',
        'Window Cleaning',
        'Jet Washing',
        'Mould Removal',
        'Hoarder Cleaning',
        'Disinfection / Antiviral'
      ]
    },
    {
      id: 'extras-addons',
      name: 'Extras / Add-Ons',
      services: [
        'Ironing',
        'Laundry Folding',
        'Bed Changing',
        'Cupboard / Fridge Cleaning',
        'Internal Windows'
      ]
    }
  ],
  home: [
    {
      id: 'handyman',
      name: 'Handyman',
      services: [
        'Flatpack Assembly',
        'Hanging Shelves / Mirrors',
        'TV Mounting',
        'Door / Lock Repairs',
        'Curtain / Blind Fitting'
      ]
    },
    {
      id: 'electrical',
      name: 'Electrical',
      services: [
        'Light Replacement',
        'Socket / Switch Install',
        'Fuse Box Work',
        'Minor Rewiring',
        'PAT Testing'
      ]
    },
    {
      id: 'plumbing',
      name: 'Plumbing',
      services: [
        'Tap Repair',
        'Sink / Toilet Unblocking',
        'Shower Installation',
        'Leak Detection',
        'Radiator Bleeding'
      ]
    },
    {
      id: 'gardening',
      name: 'Gardening',
      services: [
        'Lawn Mowing',
        'Hedge Trimming',
        'Weeding',
        'General Garden Tidy',
        'Jet Washing'
      ]
    }
  ]
};

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections = 3,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<'categories' | 'services'>('categories');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    setSelectedServices([]);
    setCurrentStep('services');
  };

  const handleServiceToggle = (service: string) => {
    const newSelected = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    
    setSelectedServices(newSelected);
  };

  const handleConfirmServices = () => {
    if (selectedMainCategory && selectedServices.length > 0) {
      // Add the category to selected categories if not already there
      const newSelection = selectedCategories.includes(selectedMainCategory)
        ? selectedCategories
        : [...selectedCategories, selectedMainCategory];
      
      if (newSelection.length <= maxSelections) {
        onSelectionChange(newSelection);
      }
    }
    
    // Reset and go back to category selection
    setCurrentStep('categories');
    setSelectedMainCategory(null);
    setSelectedServices([]);
  };

  const handleBackToCategories = () => {
    setCurrentStep('categories');
    setSelectedMainCategory(null);
    setSelectedServices([]);
  };

  const handleRemoveCategory = (categoryId: string) => {
    onSelectionChange(selectedCategories.filter(id => id !== categoryId));
  };

  if (currentStep === 'services' && selectedMainCategory) {
    const categoryData = mainCategories.find(cat => cat.id === selectedMainCategory);
    const groups = serviceGroups[selectedMainCategory] || [];

    return (
      <div className={cn("space-y-6", className)}>
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToCategories}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {categoryData?.emoji} {categoryData?.name.toUpperCase()}
            </h2>
            <p className="text-sm text-muted-foreground">
              Select the services you offer
            </p>
          </div>
        </div>

        {/* Service groups */}
        <div className="space-y-6">
          {groups.map((group) => {
            const groupServices = [...group.services, `${group.name} - Other`];
            const selectedGroupServices = selectedServices.filter(service => 
              groupServices.includes(service)
            );
            const isAllSelected = groupServices.length > 0 && selectedGroupServices.length === groupServices.length;
            
            const handleSelectAll = () => {
              const newServices = [...new Set([...selectedServices, ...groupServices])];
              setSelectedServices(newServices);
            };
            
            const handleDeselectAll = () => {
              const newServices = selectedServices.filter(service => 
                !groupServices.includes(service)
              );
              setSelectedServices(newServices);
            };

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{group.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={isAllSelected}
                      className="text-xs h-6 px-2"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={selectedGroupServices.length === 0}
                      className="text-xs h-6 px-2"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.services.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                        variant="provider"
                      />
                      <label
                        htmlFor={service}
                        className="text-sm cursor-pointer hover:text-accent"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                  {/* Other option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${group.id}-other`}
                      checked={selectedServices.includes(`${group.name} - Other`)}
                      onCheckedChange={() => handleServiceToggle(`${group.name} - Other`)}
                      variant="provider"
                    />
                    <label
                      htmlFor={`${group.id}-other`}
                      className="text-sm cursor-pointer hover:text-accent"
                    >
                      Other
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleConfirmServices}
            disabled={selectedServices.length === 0}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Add Services ({selectedServices.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={handleBackToCategories}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select Your Service Categories</h2>
        <p className="text-sm text-muted-foreground">
          Choose the main categories that best describe your business
        </p>
        {selectedCategories.length > 0 && (
          <p className="text-sm font-medium text-accent">
            {selectedCategories.length} of {maxSelections} categories selected
          </p>
        )}
      </div>

      {/* Selected categories */}
      {selectedCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Selected Categories:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const categoryData = mainCategories.find(cat => cat.id === categoryId);
              return categoryData ? (
                <div
                  key={categoryId}
                  className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm"
                >
                  <span>{categoryData.emoji}</span>
                  <span>{categoryData.name}</span>
                  <button
                    onClick={() => handleRemoveCategory(categoryId)}
                    className="hover:bg-accent/20 rounded-full p-0.5 ml-1"
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Category tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mainCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const canSelect = !isSelected && selectedCategories.length < maxSelections;
          const IconComponent = category.icon;

          return (
            <div
              key={category.id}
              className={cn(
                "p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center",
                {
                  "border-accent bg-accent/10": isSelected,
                  "border-muted hover:border-accent/50 hover:bg-accent/5": canSelect,
                  "border-muted opacity-50 cursor-not-allowed": !canSelect && !isSelected,
                }
              )}
              onClick={() => canSelect ? handleCategorySelect(category.id) : undefined}
            >
              <div className="space-y-3">
                <div className="text-4xl">{category.emoji}</div>
                <div className="p-3 rounded-lg bg-background">
                  <IconComponent className="h-8 w-8 mx-auto text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  {isSelected && (
                    <p className="text-xs text-accent font-medium mt-1">Selected</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection limit message */}
      {selectedCategories.length >= maxSelections && (
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            Maximum categories selected. Remove one to select a different category.
          </p>
        </div>
      )}
    </div>
  );
};
