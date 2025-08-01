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
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live bookings</span>
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg opacity-90">
            <div className="text-sm font-medium text-gray-700">
              <span className="text-sage-600">500+</span> providers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};