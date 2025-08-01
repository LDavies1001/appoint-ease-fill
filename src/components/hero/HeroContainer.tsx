import React from 'react';

interface HeroContainerProps {
  children: React.ReactNode;
}

export const HeroContainer = ({ children }: HeroContainerProps) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/10 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      
      {/* Main content container */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};