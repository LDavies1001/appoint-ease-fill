import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ImageDropzoneProps {
  onUploadComplete: () => void;
  bucket?: string;
  folder?: string;
  maxFiles?: number;
  maxSizeInMB?: number;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onUploadComplete,
  bucket = 'portfolio',
  folder = '',
  maxFiles = 10,
  maxSizeInMB = 5
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.slice(0, maxFiles);
    
    const newFiles: UploadFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    // Validate file sizes
    const invalidFiles = newFiles.filter(f => f.file.size > maxSizeInMB * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "Some files are too large",
        description: `Maximum file size is ${maxSizeInMB}MB`,
        variant: "destructive"
      });
      return;
    }

    setUploadFiles(newFiles);
  }, [maxFiles, maxSizeInMB, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles,
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUploadFiles = async () => {
    if (!profile?.user_id || uploadFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const uploadFile = uploadFiles[i];
        
        // Update status to uploading
        setUploadFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading', progress: 0 };
          return updated;
        });

        try {
          const fileExt = uploadFile.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = folder 
            ? `${profile.user_id}/${folder}/${fileName}`
            : `${profile.user_id}/${fileName}`;

          // Upload file (Supabase doesn't support progress tracking in browser)
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, uploadFile.file);

          if (uploadError) throw uploadError;

          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadFiles(prev => {
              const updated = [...prev];
              if (updated[i] && updated[i].progress < 95) {
                updated[i] = { ...updated[i], progress: updated[i].progress + 10 };
              }
              return updated;
            });
          }, 100);

          // Clear interval after simulated progress
          setTimeout(() => {
            clearInterval(progressInterval);
          }, 1000);

          // Update to success
          setUploadFiles(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'success', progress: 100 };
            return updated;
          });

        } catch (error: any) {
          // Update to error
          setUploadFiles(prev => {
            const updated = [...prev];
            updated[i] = { 
              ...updated[i], 
              status: 'error', 
              error: error.message || 'Upload failed' 
            };
            return updated;
          });
        }
      }

      const successCount = uploadFiles.filter(f => f.status === 'success').length;
      const errorCount = uploadFiles.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast({
          title: `${successCount} image${successCount === 1 ? '' : 's'} uploaded successfully!`,
          description: errorCount > 0 ? `${errorCount} files failed to upload` : undefined
        });
        onUploadComplete();
      }

      if (errorCount === uploadFiles.length) {
        toast({
          title: "Upload failed",
          description: "All files failed to upload",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear files after a delay
      setTimeout(() => {
        uploadFiles.forEach(f => URL.revokeObjectURL(f.preview));
        setUploadFiles([]);
      }, 2000);
    }
  };

  const clearAll = () => {
    uploadFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setUploadFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card 
        {...getRootProps()} 
        className={`card-elegant cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isDragActive 
            ? 'border-provider bg-provider/5 shadow-lg scale-[1.02]' 
            : 'border-dashed border-border hover:border-provider/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center">
          {isDragActive ? (
            <div className="animate-bounce">
              <Upload className="h-12 w-12 mx-auto mb-4 text-provider" />
              <p className="text-lg font-medium text-provider">Drop your images here!</p>
              <p className="text-sm text-muted-foreground mt-2">Release to upload</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-provider/10 rounded-full flex items-center justify-center">
                  <Image className="h-8 w-8 text-provider" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Images</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your images here, or click to browse
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                <span>• Max {maxFiles} files</span>
                <span>• Up to {maxSizeInMB}MB each</span>
                <span>• JPG, PNG, GIF, WebP</span>
              </div>
              <Button variant="provider" size="sm" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* File Preview and Upload */}
      {uploadFiles.length > 0 && (
        <Card className="card-elegant">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Ready to Upload ({uploadFiles.length})</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
                <Button 
                  variant="provider" 
                  size="sm" 
                  onClick={handleUploadFiles}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadFiles.map((uploadFile, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={uploadFile.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    {uploadFile.status === 'pending' && (
                      <div className="text-white text-center">
                        <Upload className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">Ready</p>
                      </div>
                    )}
                    
                    {uploadFile.status === 'uploading' && (
                      <div className="text-white text-center w-full px-2">
                        <div className="animate-spin h-6 w-6 mx-auto mb-2 border-2 border-white border-t-transparent rounded-full" />
                        <Progress value={uploadFile.progress} className="h-1 bg-white/20" />
                        <p className="text-xs mt-1">{Math.round(uploadFile.progress)}%</p>
                      </div>
                    )}
                    
                    {uploadFile.status === 'success' && (
                      <div className="text-green-400 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">Success</p>
                      </div>
                    )}
                    
                    {uploadFile.status === 'error' && (
                      <div className="text-red-400 text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">Failed</p>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {/* File Info */}
                  <div className="mt-2">
                    <p className="text-xs font-medium truncate" title={uploadFile.file.name}>
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageDropzone;