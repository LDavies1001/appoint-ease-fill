import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OperatingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface OperatingHoursSectionProps {
  data: {
    operating_hours: OperatingHours;
    availability_notes: string;
  };
  userId: string;
  onUpdate: (data: any) => void;
}

export const OperatingHoursSection: React.FC<OperatingHoursSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const formatOperatingHours = (hours: OperatingHours): string => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.map(day => {
          const dayHours = hours[day as keyof OperatingHours];
          return dayHours.closed ? 'Closed' : `${dayHours.open} - ${dayHours.close}`;
        }).join('\n');
      };

      const { error } = await supabase
        .from('provider_details')
        .update({
          operating_hours: formatOperatingHours(editData.operating_hours),
          availability_notes: editData.availability_notes
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Operating Hours updated ✅",
        description: "Your operating hours have been updated successfully"
      });
    } catch (error) {
      console.error('Error updating operating hours:', error);
      toast({
        title: "Update failed",
        description: "Could not update operating hours",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const updateDayHours = (day: keyof OperatingHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setEditData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day],
          [field]: value
        }
      }
    }));
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <CardTitle className="text-xl">Operating Hours</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 hover:bg-accent/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              {Object.entries(dayNames).map(([day, dayLabel]) => {
                const dayKey = day as keyof OperatingHours;
                const dayData = editData.operating_hours[dayKey];
                
                return (
                  <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-20 font-medium text-sm">
                      {dayLabel}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={dayData.closed}
                        onCheckedChange={(checked) => 
                          updateDayHours(dayKey, 'closed', checked as boolean)
                        }
                      />
                      <span className="text-sm">Closed</span>
                    </div>
                    
                    {!dayData.closed && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={dayData.open}
                          onChange={(e) => updateDayHours(dayKey, 'open', e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={dayData.close}
                          onChange={(e) => updateDayHours(dayKey, 'close', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_notes">Availability Notes</Label>
              <Input
                id="availability_notes"
                value={editData.availability_notes || ''}
                onChange={(e) => setEditData({ ...editData, availability_notes: e.target.value })}
                placeholder="e.g. By appointment only, Emergency available"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="sm"
                variant="provider"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(dayNames).map(([day, dayLabel]) => {
                const dayKey = day as keyof OperatingHours;
                const dayData = data.operating_hours[dayKey];
                
                return (
                  <div key={day} className="flex justify-between items-center py-1">
                    <span className="font-medium text-sm">{dayLabel}</span>
                    <span className="text-sm text-muted-foreground">
                      {dayData.closed ? 'Closed' : `${dayData.open} - ${dayData.close}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {data.availability_notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="font-medium text-sm">{data.availability_notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};