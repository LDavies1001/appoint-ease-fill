import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, FileText, Calendar } from 'lucide-react';

interface BusinessProfileData {
  business_description: string;
  operating_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface SummaryStepProps {
  formData: BusinessProfileData;
  onUpdate: (updates: Partial<BusinessProfileData>) => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      times.push({ value: timeString, label: displayTime });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export const SummaryStep: React.FC<SummaryStepProps> = ({
  formData,
  onUpdate
}) => {
  const updateOperatingHours = (
    day: string, 
    field: 'open' | 'close' | 'closed', 
    value: string | boolean
  ) => {
    onUpdate({
      operating_hours: {
        ...formData.operating_hours,
        [day]: {
          ...formData.operating_hours[day as keyof typeof formData.operating_hours],
          [field]: value
        }
      }
    });
  };

  const handleSelectAll = () => {
    const updatedHours = { ...formData.operating_hours };
    DAYS.forEach(({ key }) => {
      if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(key)) {
        updatedHours[key as keyof typeof updatedHours] = {
          open: '09:00',
          close: '17:00',
          closed: false
        };
      } else {
        updatedHours[key as keyof typeof updatedHours] = {
          open: '09:00',
          close: '17:00',
          closed: true
        };
      }
    });
    onUpdate({ operating_hours: updatedHours });
  };

  const handleDeselectAll = () => {
    const updatedHours = { ...formData.operating_hours };
    DAYS.forEach(({ key }) => {
      updatedHours[key as keyof typeof updatedHours] = {
        ...updatedHours[key as keyof typeof updatedHours],
        closed: true
      };
    });
    onUpdate({ operating_hours: updatedHours });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Business Summary</h3>
            <p className="text-sm text-muted-foreground">
              Add a description and set your operating hours.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Description */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Business Description
              </Label>
            </div>
            <Textarea
              value={formData.business_description}
              onChange={(e) => onUpdate({ business_description: e.target.value })}
              placeholder="Describe your business, services, and what makes you unique..."
              className="min-h-[120px] text-base"
            />
            <p className="text-xs text-muted-foreground">
              This will help customers understand what you offer and why they should choose you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Operating Hours
              </Label>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                Select All (9-5)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="text-xs"
              >
                Close All Days
              </Button>
            </div>
            
            <div className="space-y-4">
              {DAYS.map(({ key, label }) => {
                const hours = formData.operating_hours?.[key as keyof typeof formData.operating_hours];
                
                // Provide default if missing
                const safeHours = hours || { open: '09:00', close: '17:00', closed: true };
                
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{label}</Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Open</Label>
                        <Switch
                          checked={!safeHours.closed}
                          onCheckedChange={(checked) => 
                            updateOperatingHours(key, 'closed', !checked)
                          }
                        />
                      </div>
                    </div>
                    
                    {!safeHours.closed && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Opening Time</Label>
                          <Select
                            value={safeHours.open}
                            onValueChange={(value) => updateOperatingHours(key, 'open', value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-50 bg-background">
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={`open-${time.value}`} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Closing Time</Label>
                          <Select
                            value={safeHours.close}
                            onValueChange={(value) => updateOperatingHours(key, 'close', value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-50 bg-background">
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={`close-${time.value}`} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Note */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">
              Almost done!
            </p>
            <p className="text-sm text-muted-foreground">
              Review your information and click "Complete" to finish setting up your business profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};