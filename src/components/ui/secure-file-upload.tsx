import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { SecurityValidator, useSecurityMonitoring } from '@/utils/securityEnhanced';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SecureFileUploadProps {
  bucket: string;
  allowedTypes: string[];
  maxSize: number;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
  folder?: string;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  bucket,
  allowedTypes,
  maxSize,
  onUploadComplete,
  disabled = false,
  folder = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const { logFileUploadViolation } = useSecurityMonitoring();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setErrors([]);

      // Enhanced security validation
      const validation = SecurityValidator.validateFileUpload(file, allowedTypes, maxSize);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        await logFileUploadViolation(file.name, validation.errors.join(', '));
        return;
      }

      // Check rate limiting
      const canUpload = await SecurityValidator.checkRateLimit(
        'file_upload',
        undefined,
        10, // max 10 uploads
        60  // per hour
      );

      if (!canUpload) {
        setErrors(['Upload rate limit exceeded. Please try again later.']);
        return;
      }

      // Generate secure file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create FormData with security metadata
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Supabase Storage with validation
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            uploaded_by: user.id,
            original_name: SecurityValidator.sanitizeInput(file.name),
            upload_time: new Date().toISOString(),
            size: file.size.toString(),
            mimetype: file.type
          }
        });

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Log successful upload
      await SecurityValidator.logSecurityEvent('file_upload_success', {
        bucket,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        upload_path: data.path
      }, user.id);

      onUploadComplete(urlData.publicUrl);
      toast.success('File uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setErrors([errorMessage]);
      
      // Log upload failure
      await SecurityValidator.logSecurityEvent('file_upload_error', {
        error: errorMessage,
        file_name: file.name
      });
      
      toast.error('Upload failed: ' + errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejectionReasons = rejectedFiles.map(rejection => 
        rejection.errors.map((error: any) => error.message).join(', ')
      );
      setErrors(rejectionReasons);
      return;
    }

    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false,
    disabled: disabled || uploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${(disabled || uploading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <Upload className="h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive 
                  ? 'Drop the file here' 
                  : 'Drag & drop a file here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500">
                Max size: {formatFileSize(maxSize)} | 
                Types: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
              </p>
            </>
          )}
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-gray-600">{uploadProgress}%</p>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};