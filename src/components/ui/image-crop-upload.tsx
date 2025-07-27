import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, RotateCcw, Crop as CropIcon, ZoomIn, ZoomOut, Loader2, Check, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropUploadProps {
  onUpload: (url: string) => void;
  bucket: string;
  folder?: string;
  aspectRatio?: number; // width/height ratio, undefined for free crop
  maxWidth?: number;
  maxHeight?: number;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageCropUpload: React.FC<ImageCropUploadProps> = ({
  onUpload,
  bucket,
  folder = '',
  aspectRatio,
  maxWidth = 1200,
  maxHeight = 1200,
  children,
  className = '',
  title = 'Upload & Crop Image',
  description = 'Select an image and crop it to your preferred size'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);
  const [uploading, setUploading] = useState(false);
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image under 10MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please choose an image file",
          variant: "destructive"
        });
        return;
      }

      setCrop(undefined); // Makes crop preview update between images
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(file);
      setIsOpen(true);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const canvasPreview = useCallback(
    async (
      image: HTMLImageElement,
      canvas: HTMLCanvasElement,
      crop: PixelCrop,
      scale = 1,
      rotate = 0,
    ) => {
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const rotateRads = (rotate * Math.PI) / 180;
      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      ctx.translate(-cropX, -cropY);
      ctx.translate(centerX, centerY);
      ctx.rotate(rotateRads);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );

      ctx.restore();
    },
    [],
  );

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate,
      );
    }
  }, [canvasPreview, completedCrop, scale, rotate]);

  const handleUpload = useCallback(async () => {
    if (!completedCrop || !previewCanvasRef.current || !user) {
      toast({
        title: "Error",
        description: "Please select a crop area first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const canvas = previewCanvasRef.current;
      
      // Resize if needed
      let finalCanvas = canvas;
      if (canvas.width > maxWidth || canvas.height > maxHeight) {
        finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        finalCanvas.width = canvas.width * ratio;
        finalCanvas.height = canvas.height * ratio;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Upload to Supabase
      const fileExt = 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = folder ? `${user.id}/${folder}/${fileName}` : `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      handleClose();
      
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [completedCrop, user, bucket, folder, maxWidth, maxHeight, onUpload, toast]);

  const handleClose = () => {
    setIsOpen(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
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
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />
      
      {children ? (
        <div onClick={triggerFileSelect} className={`cursor-pointer ${className}`}>
          {children}
        </div>
      ) : (
        <Button
          onClick={triggerFileSelect}
          variant="outline"
          className={className}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main crop area */}
            <div className="lg:col-span-2 space-y-4">
              {imgSrc && (
                <div className="overflow-auto max-h-[400px] border rounded-lg">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      style={{ 
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                        maxHeight: '400px',
                        width: 'auto'
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
              )}

              {/* Controls */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scale control */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Zoom: {Math.round(scale * 100)}%
                    </Label>
                    <Slider
                      value={[scale]}
                      onValueChange={(value) => setScale(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Rotate control */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Rotate: {rotate}°
                    </Label>
                    <Slider
                      value={[rotate]}
                      onValueChange={(value) => setRotate(value[0])}
                      min={-180}
                      max={180}
                      step={90}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview and actions */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Preview</Label>
                <div className="border rounded-lg overflow-hidden bg-checkered">
                  {completedCrop && (
                    <canvas
                      ref={previewCanvasRef}
                      className="max-w-full h-auto"
                      style={{
                        border: '1px solid black',
                        objectFit: 'contain',
                        width: '100%',
                        height: 'auto',
                        maxHeight: '200px'
                      }}
                    />
                  )}
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-2">{description}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!completedCrop || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};