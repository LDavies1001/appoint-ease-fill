import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Edit2, Save, X, Upload, FileText, Trash2, Plus } from 'lucide-react';

interface CertificationsData {
  certifications: string;
  insurance_info: string;
  certification_files: string[];
  awards_recognitions: string;
  professional_memberships: string;
  other_qualifications: string;
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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Parse string data into arrays for easier management
  const [certificationsList, setCertificationsList] = useState<string[]>([]);
  const [insuranceList, setInsuranceList] = useState<string[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<string[]>([]);
  const [awardsList, setAwardsList] = useState<string[]>([]);
  const [membershipsList, setMembershipsList] = useState<string[]>([]);
  const [otherQualificationsList, setOtherQualificationsList] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    // Parse existing string data into arrays
    const parseCertifications = () => {
      if (data.certifications) {
        // Split by line breaks and filter out empty lines
        const items = data.certifications.split('\n').filter(item => item.trim() !== '');
        setCertificationsList(items.length > 0 ? items : ['']);
      } else {
        setCertificationsList(['']);
      }
    };

    const parseInsurance = () => {
      if (data.insurance_info) {
        // Split by line breaks and filter out empty lines
        const items = data.insurance_info.split('\n').filter(item => item.trim() !== '');
        setInsuranceList(items.length > 0 ? items : ['']);
      } else {
        setInsuranceList(['']);
      }
    };

    const parseAwards = () => {
      if (data.awards_recognitions) {
        const items = data.awards_recognitions.split('\n').filter(item => item.trim() !== '');
        setAwardsList(items.length > 0 ? items : ['']);
      } else {
        setAwardsList(['']);
      }
    };

    const parseMemberships = () => {
      if (data.professional_memberships) {
        const items = data.professional_memberships.split('\n').filter(item => item.trim() !== '');
        setMembershipsList(items.length > 0 ? items : ['']);
      } else {
        setMembershipsList(['']);
      }
    };

    const parseOtherQualifications = () => {
      if (data.other_qualifications) {
        const items = data.other_qualifications.split('\n').filter(item => item.trim() !== '');
        setOtherQualificationsList(items.length > 0 ? items : ['']);
      } else {
        setOtherQualificationsList(['']);
      }
    };

    parseCertifications();
    parseInsurance();
    parseAwards();
    parseMemberships();
    parseOtherQualifications();
    setCertificationFiles(data.certification_files || []);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert arrays back to strings for database storage
      const certificationsString = certificationsList.filter(item => item.trim() !== '').join('\n');
      const insuranceString = insuranceList.filter(item => item.trim() !== '').join('\n');

      const { error } = await supabase
        .from('provider_details')
        .update({
          certifications: certificationsString,
          insurance_info: insuranceString,
          certification_files: certificationFiles
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate({
        certifications: certificationsString,
        insurance_info: insuranceString,
        certification_files: certificationFiles
      });
      
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
    // Reset to original data
    const parsedCertifications = data.certifications 
      ? data.certifications.split('\n').filter(item => item.trim() !== '') 
      : [''];
    const parsedInsurance = data.insurance_info 
      ? data.insurance_info.split('\n').filter(item => item.trim() !== '') 
      : [''];
    
    setCertificationsList(parsedCertifications.length > 0 ? parsedCertifications : ['']);
    setInsuranceList(parsedInsurance.length > 0 ? parsedInsurance : ['']);
    setCertificationFiles(data.certification_files || []);
    setIsEditing(false);
  };

  const addCertificationItem = () => {
    setCertificationsList([...certificationsList, '']);
  };

  const removeCertificationItem = (index: number) => {
    setCertificationsList(certificationsList.filter((_, i) => i !== index));
  };

  const updateCertificationItem = (index: number, value: string) => {
    const updated = [...certificationsList];
    updated[index] = value;
    setCertificationsList(updated);
  };

  const addInsuranceItem = () => {
    setInsuranceList([...insuranceList, '']);
  };

  const removeInsuranceItem = (index: number) => {
    setInsuranceList(insuranceList.filter((_, i) => i !== index));
  };

  const updateInsuranceItem = (index: number, value: string) => {
    const updated = [...insuranceList];
    updated[index] = value;
    setInsuranceList(updated);
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
        setCertificationFiles(prev => [...prev, ...uploadedUrls]);
        
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
      setCertificationFiles(prev => prev.filter((_, i) => i !== index));

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

  const renderListItems = (
    items: string[], 
    updateItem: (index: number, value: string) => void, 
    addItem: () => void, 
    removeItem: (index: number) => void,
    placeholder: string
  ) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {items.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeItem(index)}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );

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
                variant="provider"
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
              variant="provider-outline"
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
              <Label className="text-base font-medium mb-3 block">
                Insurance Information
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Add your insurance details, DBS checks, and safety certifications
              </p>
              {renderListItems(
                insuranceList,
                updateInsuranceItem,
                addInsuranceItem,
                removeInsuranceItem,
                "e.g., DBS Checked, Public Liability Insurance"
              )}
            </div>
            
            <div>
              <Label className="text-base font-medium mb-3 block">
                Certifications & Qualifications
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                List your professional certifications and qualifications
              </p>
              {renderListItems(
                certificationsList,
                updateCertificationItem,
                addCertificationItem,
                removeCertificationItem,
                "e.g., Level 3 Beauty Therapy, VTCT Diploma"
              )}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Certification Files</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Upload certificates, diplomas, and other credential documents
            </p>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-provider/30 transition-colors">
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

              {certificationFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files ({certificationFiles.length})</h4>
                  {certificationFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-provider" />
                        <div>
                          <span className="text-sm font-medium truncate">
                            {file.split('/').pop()?.split('-').slice(1).join('-') || `Certificate ${index + 1}`}
                          </span>
                          <p className="text-xs text-muted-foreground">Uploaded certificate</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(file, index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-provider" />
                Insurance Information
              </h4>
              {data.insurance_info ? (
                <div className="space-y-2">
                  {data.insurance_info.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insurance information provided</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-provider" />
                Certifications & Qualifications
              </h4>
              {data.certifications ? (
                <div className="space-y-2">
                  {data.certifications.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications listed</p>
              )}
            </div>
          </div>
          
          {data.certification_files && data.certification_files.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-provider" />
                Certification Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.certification_files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-provider/30 hover:shadow-md transition-all"
                  >
                    <FileText className="h-5 w-5 text-provider" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        Certificate {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">View document</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};