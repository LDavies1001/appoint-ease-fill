import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Trash2, Edit, Star, Pin, Heart } from 'lucide-react';
import { UploadedImage } from '@/hooks/useImageLibrary';

interface ImageCardProps {
  image: UploadedImage;
  onDelete: (image: UploadedImage) => void;
  onTogglePortfolio?: (image: UploadedImage) => void;
  onToggleFeatured?: (image: UploadedImage) => void;
  showBucket?: boolean;
  showActions?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onDelete, 
  onTogglePortfolio,
  onToggleFeatured,
  showBucket = true,
  showActions = true 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatBucketName = (bucket: string) => {
    if (bucket === 'profile-photos') return 'Profile Pictures';
    if (bucket === 'portfolio') return 'Portfolio';
    if (bucket === 'business-photos') return 'Business Photos';
    return bucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <TooltipProvider>
      <Card className="card-elegant overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted/50">
          {!imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
                  <div className="text-muted-foreground text-sm">Loading...</div>
                </div>
              )}
              <img
                src={image.url}
                alt={image.name}
                className={`w-full h-full object-cover transition-all duration-300 cursor-pointer ${
                  imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'
                }`}
                onClick={() => window.open(image.url, '_blank')}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Failed to load</p>
              </div>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {image.show_in_portfolio && (
              <Badge variant="secondary" className="bg-provider/90 text-white border-0 shadow-md">
                <Star className="h-3 w-3 mr-1" />
                Portfolio
              </Badge>
            )}
            {image.isPinned && (
              <Badge variant="secondary" className="bg-yellow-500/90 text-yellow-900 border-0 shadow-md">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}
          </div>

          {/* Action Overlay - Shows on Hover */}
          {showActions && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(image.url, '_blank')}
                      className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View full size</TooltipContent>
                </Tooltip>

                {onTogglePortfolio && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onTogglePortfolio(image)}
                        className={`shadow-lg ${
                          image.show_in_portfolio 
                            ? 'bg-provider text-white hover:bg-provider-dark' 
                            : 'bg-white/90 hover:bg-white text-gray-800'
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {image.show_in_portfolio ? 'Remove from portfolio' : 'Add to portfolio'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Details */}
        <div className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-foreground truncate" title={image.name}>
              {image.name}
            </h4>
            
            {showBucket && (
              <p className="text-xs text-muted-foreground font-medium">
                {formatBucketName(image.bucket)}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(image.size)}</span>
              {image.caption && (
                <span className="truncate ml-2" title={image.caption}>
                  "{image.caption}"
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(image.url, '_blank')}
                className="flex-1 text-xs hover:border-provider hover:text-provider"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{image.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(image)}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default ImageCard;