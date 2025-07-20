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
  county: string;
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

const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'Durham',
  'East Riding of Yorkshire', 'East Sussex', 'Essex', 'Gloucestershire',
  'Greater London', 'Greater Manchester', 'Hampshire', 'Herefordshire',
  'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire',
  'Lincolnshire', 'Merseyside', 'Norfolk', 'North Yorkshire', 'Northamptonshire',
  'Northumberland', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire',
  'Somerset', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey',
  'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex', 'West Yorkshire',
  'Wiltshire', 'Worcestershire'
];

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
          <Label htmlFor="county" className="text-sm font-medium">
            County <span className="text-destructive">*</span>
          </Label>
          <Select value={value.county} onValueChange={(val) => handleFieldChange('county', val)}>
            <SelectTrigger className={errors.county ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {UK_COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.county && (
            <p className="text-sm text-destructive mt-1">{errors.county}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="address-public"
          checked={value.is_public}
          onCheckedChange={(checked) => handleFieldChange('is_public', checked as boolean)}
        />
        <div className="flex-1">
          <Label htmlFor="address-public" className="flex items-center space-x-2 cursor-pointer">
            {value.is_public ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {value.is_public ? 'Address visible to customers' : 'Address hidden from customers'}
            </span>
          </Label>
          <p className="text-xs text-muted-foreground ml-6">
            {value.is_public 
              ? 'Customers can see your full business address' 
              : 'Only general area (town/city) will be visible to customers'
            }
          </p>
        </div>
      </div>
    </div>
  );
};