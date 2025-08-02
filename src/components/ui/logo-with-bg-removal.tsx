import React, { useState, useEffect } from 'react';
import { removeBackground, loadImageFromUrl } from '@/lib/background-removal';

interface LogoWithBgRemovalProps {
  src: string;
  alt: string;
  className?: string;
}

export const LogoWithBgRemoval = ({ src, alt, className }: LogoWithBgRemovalProps) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processLogo = async () => {
      if (!src) return;
      
      setIsProcessing(true);
      setError(null);
      
      try {
        // Load the original image
        const originalImage = await loadImageFromUrl(src);
        
        // Remove background
        const processedBlob = await removeBackground(originalImage);
        
        // Create URL for the processed image
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedImageUrl(processedUrl);
      } catch (err) {
        console.error('Error processing logo:', err);
        setError('Failed to process logo');
        // Fallback to original image
        setProcessedImageUrl(src);
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    // Cleanup function
    return () => {
      if (processedImageUrl && processedImageUrl !== src) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [src]);

  if (isProcessing) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error && !processedImageUrl) {
    return (
      <img 
        src={src}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <img 
      src={processedImageUrl || src}
      alt={alt}
      className={className}
    />
  );
};