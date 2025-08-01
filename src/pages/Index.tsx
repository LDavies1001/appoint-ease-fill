import React from 'react';
import { Calendar, Star, Search, MapPin, Building, CheckCircle } from 'lucide-react';
import { HeroContainer } from '@/components/hero/HeroContainer';
import { HeroContent } from '@/components/hero/HeroContent';
import { HeroImage } from '@/components/hero/HeroImage';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

import { FinalCTASection } from '@/components/landing/FinalCTASection';

const Index = () => {
  return (
    <div className="w-full">
      {/* Hero Section with integrated sticky header */}
      <HeroContainer>
        <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr,0.9fr] gap-8 lg:gap-16 xl:gap-20 items-center py-8 sm:py-12 lg:py-16 xl:py-20 min-h-[90vh] w-full">
          {/* Left Side - Content */}
          <HeroContent />

          {/* Right Side - Hero Image */}
          <div className="lg:order-last order-first w-full">
            <HeroImage />
          </div>
        </div>
      </HeroContainer>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  );
};

export default Index;