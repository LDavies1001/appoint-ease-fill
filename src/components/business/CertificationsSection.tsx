import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Edit2, Save, X, Upload, FileText, Trash2 } from 'lucide-react';

interface CertificationsData {
  certifications: string;
  insurance_info: string;
  certification_files: string[];
  emergency_available: boolean;
}

interface CertificationsSectionProps {
  data: CertificationsData;
  userId: string;
  onUpdate: (updatedData: Partial<CertificationsData>) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditData(data);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({
          certifications: editData.certifications,
          insurance_info: editData.insurance_info,
          certification_files: editData.certification_files,
          emergency_available: editData.emergency_available
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Certifications updated",
        description: "Your certification information has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating certifications:', error);
      toast({
        title: "Update failed",
        description: "Could not update your certifications. Please try again.",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is over 5MB. Please choose a smaller file.`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/certifications/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('certifications')
          .upload(fileName, file);
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('certifications')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setEditData(prev => ({ 
          ...prev, 
          certification_files: [...prev.certification_files, ...uploadedUrls] 
        }));
        
        toast({
          title: "Files uploaded",
          description: `${uploadedUrls.length} certification file(s) uploaded successfully`
        });
      }
    } catch (error) {
      console.error('Error uploading certifications:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload some files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileUrl: string, index: number) => {
    try {
      // Extract file path from URL for deletion
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userId}/certifications/${fileName}`;

      const { error } = await supabase.storage
        .from('certifications')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
      }

      // Remove from local state regardless of storage deletion result
      setEditData(prev => ({
        ...prev,
        certification_files: prev.certification_files.filter((_, i) => i !== index)
      }));

      toast({
        title: "File removed",
        description: "Certification file has been removed"
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Remove failed",
        description: "Could not remove the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold">Certifications & Insurance</h3>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="insurance_info" className="text-base font-medium">
                Insurance Information
              </Label>
              <Textarea
                id="insurance_info"
                value={editData.insurance_info}
                onChange={(e) => setEditData(prev => ({ ...prev, insurance_info: e.target.value }))}
                placeholder="DBS checked, public liability insurance, etc."
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="certifications" className="text-base font-medium">
                Certifications & Qualifications
              </Label>
              <Textarea
                id="certifications"
                value={editData.certifications}
                onChange={(e) => setEditData(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="List your certifications, qualifications, awards, etc."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Certification Files</Label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cert-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="cert-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">
                      {uploading ? "Uploading..." : "Upload certification files"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, JPG, PNG (Max 5MB each)
                    </span>
                  </label>
                </div>
              </div>

              {editData.certification_files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files</h4>
                  {editData.certification_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">
                          {file.split('/').pop()?.split('-').slice(1).join('-') || `File ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(file, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="emergency-available"
              checked={editData.emergency_available}
              onCheckedChange={(checked) => 
                setEditData(prev => ({ ...prev, emergency_available: checked }))
              }
            />
            <Label htmlFor="emergency-available" className="text-base font-medium">
              Available for emergency/urgent bookings
            </Label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Insurance Information</h4>
              {data.insurance_info ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.insurance_info}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No insurance information provided</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Certifications</h4>
              {data.certifications ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.certifications}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications listed</p>
              )}
            </div>
          </div>
          
          {data.certification_files && data.certification_files.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Certification Files</h4>
              <p className="text-sm text-muted-foreground">
                {data.certification_files.length} file(s) uploaded
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Emergency availability: {data.emergency_available ? 'Available' : 'Not available'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};