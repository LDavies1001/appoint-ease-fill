import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Camera, X, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  children?: React.ReactNode;
  className?: string;
}

export const PhotoUpload = ({ 
  onUpload, 
  bucket, 
  folder = '', 
  accept = 'image/*',
  maxSize = 5,
  children,
  className = ''
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSize}MB`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {children ? (
        <div onClick={triggerFileSelect} className={`cursor-pointer ${className}`}>
          {children}
        </div>
      ) : (
        <Button
          onClick={triggerFileSelect}
          disabled={uploading}
          variant="outline"
          className={className}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      )}
    </>
  );
};

interface DocumentUploadProps {
  onUpload: (urls: string[]) => void;
  bucket: string;
  folder?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  children?: React.ReactNode;
  className?: string;
}

export const DocumentUpload = ({ 
  onUpload, 
  bucket, 
  folder = '', 
  multiple = true,
  maxSize = 10,
  children,
  className = ''
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFiles = async (files: FileList) => {
    try {
      setUploading(true);
      const uploadPromises = [];
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File ${file.name} size must be less than ${maxSize}MB`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const uploadPromise = supabase.storage
          .from(bucket)
          .upload(filePath, file)
          .then(({ data, error }) => {
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            return publicUrl;
          });

        uploadPromises.push(uploadPromise);
      }

      const urls = await Promise.all(uploadPromises);
      onUpload(urls);
      
      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {children ? (
        <div onClick={triggerFileSelect} className={`cursor-pointer ${className}`}>
          {children}
        </div>
      ) : (
        <Button
          onClick={triggerFileSelect}
          disabled={uploading}
          variant="outline"
          className={className}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Documents'}
        </Button>
      )}
    </>
  );
};