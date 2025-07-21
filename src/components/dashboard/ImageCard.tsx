import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2 } from 'lucide-react';
import { UploadedImage } from '@/hooks/useImageLibrary';

interface ImageCardProps {
  image: UploadedImage;
  onDelete: (image: UploadedImage) => void;
  showBucket?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, showBucket = true }) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatBucketName = (bucket: string) => {
    if (bucket === 'profile-photos') return 'Profile Pictures';
    return bucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <TooltipProvider>
      <Card className="card-elegant overflow-hidden">
        <div className="aspect-square overflow-hidden">
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
            onClick={() => window.open(image.url, '_blank')}
          />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-foreground truncate">{image.name}</p>
          {showBucket && (
            <p className="text-xs text-muted-foreground">{formatBucketName(image.bucket)}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
          <div className="flex gap-1 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(image.url, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View full size</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(image)}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default ImageCard;