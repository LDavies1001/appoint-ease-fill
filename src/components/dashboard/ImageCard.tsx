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
          <div className="flex gap-2 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(image.url, '_blank')}
                  className="flex-1 flex items-center gap-1 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View full size image</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(image)}
                  className="flex-1 flex items-center gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete this image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default ImageCard;