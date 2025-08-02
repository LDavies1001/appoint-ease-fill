import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Trash2, Edit, Star, Pin, Heart, Check, X, FolderOpen, Move, CheckSquare, Square } from 'lucide-react';
import { UploadedImage } from '@/hooks/useImageLibrary';
import { getImageContainerClasses, getImageClasses } from '@/lib/image-utils';

interface ImageCardProps {
  image: UploadedImage;
  onDelete: (image: UploadedImage) => void;
  onTogglePortfolio?: (image: UploadedImage) => void;
  onToggleFeatured?: (image: UploadedImage) => void;
  onRename?: (image: UploadedImage, newName: string) => void;
  onMoveToFolder?: (image: UploadedImage, targetFolder: string) => void;
  showBucket?: boolean;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
  isDragging?: boolean;
  // Selection props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (imageId: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onDelete, 
  onTogglePortfolio,
  onToggleFeatured,
  onRename,
  onMoveToFolder,
  showBucket = true,
  showActions = true,
  viewMode = 'grid',
  isDragging = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(image.name);

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

  const handleRename = () => {
    if (onRename && editName.trim() && editName !== image.name) {
      onRename(image, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(image.name);
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      imageId: image.id || image.name,
      imageData: image
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Different layouts for grid vs list view
  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <Card 
          className={`card-elegant overflow-hidden group hover:shadow-lg transition-all duration-300 ${
            isDragging ? 'opacity-50 scale-95' : ''
          }`}
          draggable={true}
          onDragStart={handleDragStart}
        >
          <div className="flex gap-4 p-4">
            {/* Image Thumbnail */}
            <div className={`relative w-20 h-20 flex-shrink-0 ${getImageContainerClasses('square', true, true)}`}>
              {!imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
                      <div className="text-muted-foreground text-xs">Loading...</div>
                    </div>
                  )}
                  <img
                    src={image.url}
                    alt={image.name}
                    className={`${getImageClasses('cover', true)} cursor-pointer transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    } ${selectionMode && isSelected ? 'ring-2 ring-provider' : ''}`}
                    onClick={() => selectionMode && onToggleSelect ? onToggleSelect(image.id || image.name) : window.open(image.url, '_blank')}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <Eye className="h-6 w-6 opacity-50 text-muted-foreground" />
                </div>
              )}
              
              {/* Selection checkbox overlay */}
              {selectionMode && (
                <div className="absolute top-1 right-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onToggleSelect?.(image.id || image.name)}
                    className={`w-6 h-6 p-0 shadow-md ${
                      isSelected 
                        ? 'bg-provider text-white hover:bg-provider-dark' 
                        : 'bg-white/90 hover:bg-white text-gray-800'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-1 left-1 flex flex-col gap-1">
                {image.show_in_portfolio && (
                  <Badge variant="secondary" className="bg-provider/90 text-white border-0 shadow-md text-xs p-1">
                    <Star className="h-2 w-2" />
                  </Badge>
                )}
                {image.isPinned && (
                  <Badge variant="secondary" className="bg-yellow-500/90 text-yellow-900 border-0 shadow-md text-xs p-1">
                    <Pin className="h-2 w-2" />
                  </Badge>
                )}
              </div>
            </div>

            {/* Image Details */}
            <div className="flex-1 space-y-2">
              {/* File Name (Editable) */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRename}
                      className="text-xs px-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-xs px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <h4 className="font-medium text-sm text-foreground truncate flex-1" title={image.name}>
                      {image.name}
                    </h4>
                    {onRename && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {showBucket && (
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {formatBucketName(image.bucket)}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatFileSize(image.size)}</span>
                {image.caption && (
                  <span className="truncate" title={image.caption}>
                    "{image.caption}"
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(image.url, '_blank')}
                        className="text-xs hover:border-provider hover:text-provider"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View full size</TooltipContent>
                  </Tooltip>

                  {onMoveToFolder && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hover:border-provider hover:text-provider cursor-move"
                          title="Drag to move to folder"
                        >
                          <Move className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Drag to move to folder</TooltipContent>
                    </Tooltip>
                  )}

                {onTogglePortfolio && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTogglePortfolio(image)}
                        className={`text-xs ${
                          image.show_in_portfolio 
                            ? 'bg-provider text-white hover:bg-provider-dark border-provider' 
                            : 'hover:border-provider hover:text-provider'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {image.show_in_portfolio ? 'Remove from portfolio' : 'Add to portfolio'}
                    </TooltipContent>
                  </Tooltip>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
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
  }

  // Grid view (original layout)
  return (
    <TooltipProvider>
      <Card 
        className={`card-elegant overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
          isDragging ? 'opacity-50 scale-95' : ''
        }`}
        draggable={true}
        onDragStart={handleDragStart}
      >
        {/* Image Container */}
        <div className={`relative ${getImageContainerClasses('square', true, true)}`}>
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
                className={`${getImageClasses('cover', true)} cursor-pointer transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                } ${selectionMode && isSelected ? 'ring-2 ring-provider' : ''}`}
                onClick={() => selectionMode && onToggleSelect ? onToggleSelect(image.id || image.name) : window.open(image.url, '_blank')}
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

          {/* Selection checkbox overlay - Top right */}
          {selectionMode && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onToggleSelect?.(image.id || image.name)}
                className={`w-8 h-8 p-0 shadow-md ${
                  isSelected 
                    ? 'bg-provider text-white hover:bg-provider-dark' 
                    : 'bg-white/90 hover:bg-white text-gray-800'
                }`}
              >
                {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
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

                {onMoveToFolder && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 shadow-lg cursor-move"
                        title="Drag to move to folder"
                      >
                        <Move className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Drag to move to folder</TooltipContent>
                  </Tooltip>
                )}

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
            {/* Editable File Name */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRename}
                    className="text-xs px-2"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <h4 className="font-medium text-sm text-foreground truncate flex-1" title={image.name}>
                    {image.name}
                  </h4>
                  {onRename && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
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