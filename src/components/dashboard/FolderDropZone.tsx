import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderDropZoneProps {
  folderName: string;
  onDrop: (imageData: any, targetFolder: string) => void;
  imageCount?: number;
  isActive?: boolean;
}

const FolderDropZone: React.FC<FolderDropZoneProps> = ({
  folderName,
  onDrop,
  imageCount = 0,
  isActive = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(data.imageData, folderName);
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-300 cursor-pointer border-2 border-dashed",
        isDragOver 
          ? "border-provider bg-provider/10 shadow-lg scale-105" 
          : "border-muted-foreground/30 hover:border-provider/50",
        isActive && "border-provider/50 bg-provider/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3">
        {isDragOver ? (
          <FolderOpen className="h-6 w-6 text-provider" />
        ) : (
          <Folder className="h-6 w-6 text-muted-foreground" />
        )}
        
        <div className="flex-1">
          <h4 className={cn(
            "font-medium text-sm transition-colors",
            isDragOver ? "text-provider" : "text-foreground"
          )}>
            {folderName === 'none' ? 'No Folder' : folderName}
          </h4>
          <p className="text-xs text-muted-foreground">
            {imageCount} {imageCount === 1 ? 'image' : 'images'}
          </p>
        </div>

        {isDragOver && (
          <div className="text-xs text-provider font-medium bg-provider/20 px-2 py-1 rounded">
            Drop here
          </div>
        )}
      </div>
    </Card>
  );
};

export default FolderDropZone;