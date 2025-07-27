import React from 'react';
import { cn } from '@/lib/utils';
import { getImageContainerClasses, getImageClasses, ASPECT_RATIOS } from '@/lib/image-utils';

interface AspectRatioImageProps {
  src: string;
  alt: string;
  aspectRatio?: keyof typeof ASPECT_RATIOS;
  className?: string;
  containerClassName?: string;
  fit?: 'cover' | 'contain';
  rounded?: boolean;
  hover?: boolean;
  loading?: boolean;
  fallback?: React.ReactNode;
  onClick?: () => void;
}

export const AspectRatioImage: React.FC<AspectRatioImageProps> = ({
  src,
  alt,
  aspectRatio = 'square',
  className,
  containerClassName,
  fit = 'cover',
  rounded = true,
  hover = true,
  loading = false,
  fallback,
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div 
      className={cn(
        getImageContainerClasses(aspectRatio, rounded, true),
        'group',
        containerClassName
      )}
      onClick={onClick}
    >
      {/* Loading State */}
      {(imageLoading || loading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}

      {/* Error State */}
      {imageError && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          {fallback || (
            <div className="text-center text-muted-foreground">
              <div className="text-sm">Failed to load image</div>
            </div>
          )}
        </div>
      )}

      {/* Main Image */}
      {!imageError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            getImageClasses(fit, hover, false),
            'transition-opacity duration-300',
            imageLoading ? 'opacity-0' : 'opacity-100',
            onClick && 'cursor-pointer',
            className
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};