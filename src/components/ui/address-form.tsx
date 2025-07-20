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
  country: string;
  is_public: boolean; // Whether customers can see the full address
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  className?: string;
}

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' }
];

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
          <Label htmlFor="address_line_1" className="text-sm font-medium">
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
          <Label htmlFor="address_line_2" className="text-sm font-medium">
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
          <Label htmlFor="town_city" className="text-sm font-medium">
            Town/City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="town_city"
            value={value.town_city}
            onChange={(e) => handleFieldChange('town_city', e.target.value)}
            placeholder="e.g., Manchester"
            className={errors.town_city ? 'border-destructive' : ''}
          />
          {errors.town_city && (
            <p className="text-sm text-destructive mt-1">{errors.town_city}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="postcode" className="text-sm font-medium">
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

      <div>
        <Label htmlFor="country" className="text-sm font-medium">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select value={value.country} onValueChange={(val) => handleFieldChange('country', val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Privacy Setting */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border border-muted">
        <Checkbox
          id="address-public"
          checked={value.is_public}
          onCheckedChange={(checked) => handleFieldChange('is_public', checked as boolean)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <Label htmlFor="address-public" className="flex items-center space-x-2 cursor-pointer font-medium">
            {value.is_public ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {value.is_public ? 'Full address visible to customers' : 'Full address hidden from customers'}
            </span>
          </Label>
          <div className="text-xs text-muted-foreground space-y-1">
            {value.is_public ? (
              <div>
                <p className="font-medium text-green-700">✓ Customers will see your complete address</p>
                <p>This helps customers find your business location easily but shares your exact address publicly.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-blue-700">🔒 Only your town/city will be shown to customers</p>
                <p>Your exact address stays private while customers can still find your general area. You can share specific details when booking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};