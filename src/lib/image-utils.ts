// Image layout and aspect ratio utilities

export const ASPECT_RATIOS = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  widescreen: 'aspect-video',  // 16:9
  banner: 'aspect-[3/1]',      // 3:1 for cover photos
  thumbnail: 'aspect-[5/4]',   // Slightly wider than square
} as const;

export const RESPONSIVE_GRIDS = {
  // For image galleries - responsive grid layouts
  gallery: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4',
  portfolio: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  compact: 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3',
} as const;

export const IMAGE_CLASSES = {
  // Standard image display classes
  cover: 'w-full h-full object-cover',
  contain: 'w-full h-full object-contain',
  rounded: 'rounded-lg',
  roundedFull: 'rounded-full',
  shadow: 'shadow-lg',
  hover: 'group-hover:scale-105 transition-transform duration-300',
} as const;

// Helper function to get standardized image container classes
export const getImageContainerClasses = (
  aspectRatio: keyof typeof ASPECT_RATIOS = 'square',
  rounded: boolean = true,
  background: boolean = true
) => {
  let classes = [ASPECT_RATIOS[aspectRatio], 'overflow-hidden'];
  
  if (rounded) classes.push('rounded-lg');
  if (background) classes.push('bg-muted/50');
  
  return classes.join(' ');
};

// Helper function to get standardized responsive grid classes
export const getGridClasses = (
  gridType: keyof typeof RESPONSIVE_GRIDS = 'gallery'
) => {
  return RESPONSIVE_GRIDS[gridType];
};

// Helper function to get standardized image classes
export const getImageClasses = (
  fit: 'cover' | 'contain' = 'cover',
  hover: boolean = true,
  rounded: boolean = false
) => {
  let classes = ['w-full', 'h-full'];
  
  classes.push(fit === 'cover' ? 'object-cover' : 'object-contain');
  
  if (hover) {
    classes.push('group-hover:scale-105', 'transition-transform', 'duration-300');
  }
  
  if (rounded) {
    classes.push('rounded-lg');
  }
  
  return classes.join(' ');
};