import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Globe, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfoSectionProps {
  data: {
    business_email: string;
    business_phone: string;
    business_website: string;
  };
  userId: string;
  userEmail?: string;
  onUpdate: (data: any) => void;
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  data,
  userId,
  userEmail,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleEditClick = () => {
    // Auto-populate business email with user's account email if business email is empty
    const updatedEditData = { ...data };
    if (!data.business_email && userEmail) {
      updatedEditData.business_email = userEmail;
    }
    setEditData(updatedEditData);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({
          business_email: editData.business_email,
          business_phone: editData.business_phone,
          business_website: editData.business_website
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Contact Info updated ✅",
        description: "Your contact information has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast({
        title: "Update failed",
        description: "Could not update contact information",
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

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Phone className="h-5 w-5 text-accent" />
          </div>
          <CardTitle className="text-xl">Contact Information</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEditClick}
            className="h-8 w-8 p-0 hover:bg-accent/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                type="email"
                value={editData.business_email || ''}
                onChange={(e) => setEditData({ ...editData, business_email: e.target.value })}
                placeholder="business@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <Input
                id="business_phone"
                type="tel"
                value={editData.business_phone || ''}
                onChange={(e) => setEditData({ ...editData, business_phone: e.target.value })}
                placeholder="+44 20 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_website">Website</Label>
              <Input
                id="business_website"
                type="url"
                value={editData.business_website || ''}
                onChange={(e) => setEditData({ ...editData, business_website: e.target.value })}
                placeholder="https://www.example.com"
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
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{data.business_email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{data.business_phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">
                  {data.business_website ? (
                    <a 
                      href={data.business_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {data.business_website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};