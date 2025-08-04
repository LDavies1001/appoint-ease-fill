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
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Operating Hours
              </Label>
            </div>


            {/* Weekdays Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Weekdays (Monday - Friday)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const weekdayHours = formData.operating_hours.monday;
                    const updatedHours = {
                      ...formData.operating_hours,
                      tuesday: weekdayHours,
                      wednesday: weekdayHours,
                      thursday: weekdayHours,
                      friday: weekdayHours
                    };
                    onUpdate({ operating_hours: updatedHours });
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Copy Monday to All
                </Button>
              </div>
              
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                  const dayLabels = {
                    monday: 'Monday',
                    tuesday: 'Tuesday', 
                    wednesday: 'Wednesday',
                    thursday: 'Thursday',
                    friday: 'Friday'
                  };
                  const hours = formData.operating_hours?.[day as keyof typeof formData.operating_hours] || 
                    { open: '09:00', close: '17:00', closed: false };
                  
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium">
                        {dayLabels[day as keyof typeof dayLabels]}
                      </div>
                      <div className="flex-1">
                        {!hours.closed ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={hours.open}
                              onValueChange={(value) => updateOperatingHours(day, 'open', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] z-50 bg-background">
                                {TIME_OPTIONS.slice(0, 32).map((time) => (
                                  <SelectItem key={`${day}-open-${time.value}`} value={time.value} className="text-xs">
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">to</span>
                            <Select
                              value={hours.close}
                              onValueChange={(value) => updateOperatingHours(day, 'close', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] z-50 bg-background">
                                {TIME_OPTIONS.slice(16, 48).map((time) => (
                                  <SelectItem key={`${day}-close-${time.value}`} value={time.value} className="text-xs">
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Closed</div>
                        )}
                      </div>
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => updateOperatingHours(day, 'closed', !checked)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekend Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Weekend (Saturday - Sunday)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const saturdayHours = formData.operating_hours.saturday;
                    const updatedHours = {
                      ...formData.operating_hours,
                      sunday: saturdayHours
                    };
                    onUpdate({ operating_hours: updatedHours });
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Copy Saturday to Sunday
                </Button>
              </div>
              
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                {['saturday', 'sunday'].map((day) => {
                  const dayLabels = { saturday: 'Saturday', sunday: 'Sunday' };
                  const hours = formData.operating_hours?.[day as keyof typeof formData.operating_hours] || 
                    { open: '09:00', close: '17:00', closed: true };
                  
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium">
                        {dayLabels[day as keyof typeof dayLabels]}
                      </div>
                      <div className="flex-1">
                        {!hours.closed ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={hours.open}
                              onValueChange={(value) => updateOperatingHours(day, 'open', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] z-50 bg-background">
                                {TIME_OPTIONS.slice(0, 32).map((time) => (
                                  <SelectItem key={`${day}-open-${time.value}`} value={time.value} className="text-xs">
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">to</span>
                            <Select
                              value={hours.close}
                              onValueChange={(value) => updateOperatingHours(day, 'close', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] z-50 bg-background">
                                {TIME_OPTIONS.slice(16, 48).map((time) => (
                                  <SelectItem key={`${day}-close-${time.value}`} value={time.value} className="text-xs">
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Closed</div>
                        )}
                      </div>
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => updateOperatingHours(day, 'closed', !checked)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
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