import React from 'react';
import heroImage from '@/assets/hero-marketplace-scene.jpg';

export const HeroImage = () => {
  return (
    <div className="relative animate-scale-in">
      {/* Main image container */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-rose-300/20 via-sage-300/20 to-rose-300/20 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
        
        <div className="relative overflow-hidden rounded-3xl shadow-elegant">
          <img 
            src={heroImage} 
            alt="Professional beauty appointment booking platform" 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 rounded-3xl"></div>
          
          {/* Floating elements for added depth */}
        </div>
      </div>
    </div>
  );
};