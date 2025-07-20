import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddressData {
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  postcode: string;
  is_public: boolean; // Whether customers can see the full address
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  className?: string;
}


export const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  errors = {},
  className
}) => {
  const handleFieldChange = (field: keyof AddressData, fieldValue: string | boolean) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address_line_1">
            House Number/Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address_line_1"
            value={value.address_line_1}
            onChange={(e) => handleFieldChange('address_line_1', e.target.value)}
            placeholder="e.g., 123 or Apartment A"
            className={errors.address_line_1 ? 'border-destructive' : ''}
          />
          {errors.address_line_1 && (
            <p className="text-sm text-destructive mt-1">{errors.address_line_1}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="address_line_2">
            Street <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address_line_2"
            value={value.address_line_2}
            onChange={(e) => handleFieldChange('address_line_2', e.target.value)}
            placeholder="e.g., Oxford Road"
            className={errors.address_line_2 ? 'border-destructive' : ''}
          />
          {errors.address_line_2 && (
            <p className="text-sm text-destructive mt-1">{errors.address_line_2}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="town_city">
            Town/City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="town_city"
            value={value.town_city}
            onChange={(e) => handleFieldChange('town_city', e.target.value)}
            placeholder="e.g., Manchester"
            className={errors.town_city ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Choose the closest town to you
          </p>
          {errors.town_city && (
            <p className="text-sm text-destructive mt-1">{errors.town_city}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="postcode">
            Postcode <span className="text-destructive">*</span>
          </Label>
          <Input
            id="postcode"
            value={value.postcode}
            onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
            placeholder="e.g., M23 9NY"
            className={errors.postcode ? 'border-destructive' : ''}
          />
          {errors.postcode && (
            <p className="text-sm text-destructive mt-1">{errors.postcode}</p>
          )}
        </div>
      </div>

      {/* Privacy Question */}
      <div className="space-y-4 p-6 bg-muted/30 rounded-lg border border-muted">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            How much of your address should customers see?
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose what information customers can view before booking with you.
          </p>
        </div>
        
        <div className="space-y-3">
          {/* Option 1: Show full address */}
          <div 
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
              value.is_public 
                ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                : "border-border bg-background hover:border-muted-foreground/30"
            )}
            onClick={() => handleFieldChange('is_public', true)}
          >
            <div className="flex items-center justify-center w-4 h-4 mt-0.5">
              <div className={cn(
                "w-3 h-3 rounded-full",
                value.is_public ? "bg-green-500" : "border-2 border-muted-foreground"
              )} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Show my full address publicly</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Customers will see your complete address including house number and street name. 
                This makes it easier for them to find you but shares your exact location.
              </p>
            </div>
          </div>

          {/* Option 2: Hide full address */}
          <div 
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
              !value.is_public 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "border-border bg-background hover:border-muted-foreground/30"
            )}
            onClick={() => handleFieldChange('is_public', false)}
          >
            <div className="flex items-center justify-center w-4 h-4 mt-0.5">
              <div className={cn(
                "w-3 h-3 rounded-full",
                !value.is_public ? "bg-blue-500" : "border-2 border-muted-foreground"
              )} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <EyeOff className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Keep my address private (Recommended)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only show your town/city to customers. You can share your exact address later when they book with you. 
                This protects your privacy while still letting customers find your area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};