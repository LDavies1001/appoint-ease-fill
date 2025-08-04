import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SocialMediaConnector } from '../SocialMediaConnector';
import { SecureFileUpload } from '@/components/ui/secure-file-upload';
import { Shield, Award, Share2, Upload } from 'lucide-react';

interface BusinessProfileData {
  certifications: string;
  dbs_checked: boolean;
  additional_checks: string;
  certification_files: string[];
}

interface CredentialsStepProps {
  formData: BusinessProfileData;
  onUpdate: (updates: Partial<BusinessProfileData>) => void;
}

export const CredentialsStep: React.FC<CredentialsStepProps> = ({
  formData,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Build Trust & Credibility</h3>
            <p className="text-sm text-muted-foreground">
              Add your certifications and social media to build trust with customers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Certifications & Qualifications
              </Label>
            </div>
            <Textarea
              value={formData.certifications}
              onChange={(e) => onUpdate({ certifications: e.target.value })}
              placeholder="List your relevant certifications, qualifications, and training..."
              className="min-h-[100px] text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Certification Documents
              </Label>
            </div>
            <SecureFileUpload
              bucket="certifications"
              allowedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxSize={10 * 1024 * 1024} // 10MB
              onUploadComplete={(url) => {
                const currentFiles = formData.certification_files || [];
                onUpdate({ certification_files: [...currentFiles, url] });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Background Checks */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Background Checks
              </Label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">DBS Checked</Label>
                <p className="text-xs text-muted-foreground">
                  Do you have a valid DBS check?
                </p>
              </div>
              <Switch
                checked={formData.dbs_checked}
                onCheckedChange={(checked) => onUpdate({ dbs_checked: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Additional Security Checks
              </Label>
              <Textarea
                value={formData.additional_checks}
                onChange={(e) => onUpdate({ additional_checks: e.target.value })}
                placeholder="Any other background checks or security clearances..."
                className="text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">
                Social Media Links
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your social media accounts to showcase your work and build credibility.
            </p>
            <SocialMediaConnector />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};