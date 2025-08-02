import React from 'react';
import { Calendar, Star, Search, MapPin, Building, CheckCircle } from 'lucide-react';
import { HeroContainer } from '@/components/hero/HeroContainer';
import { HeroContent } from '@/components/hero/HeroContent';
import { HeroImage } from '@/components/hero/HeroImage';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

import { FinalCTASection } from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="w-full">
      {/* Hero Section with integrated sticky header */}
      <section className="relative">
        <HeroContainer>
          <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr,0.9fr] gap-8 lg:gap-16 xl:gap-20 items-center py-8 sm:py-12 lg:py-16 xl:py-20 w-full">
            {/* Left Side - Content */}
            <HeroContent />

            {/* Right Side - Hero Image */}
            <div className="lg:order-last order-first w-full">
              <HeroImage />
            </div>
          </div>
        </HeroContainer>
        {/* Section Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent shadow-lg"></div>
      </section>

      {/* Features Section */}
      <section className="relative bg-gradient-to-b from-background to-slate-50/50 border-b-2 border-border/60 shadow-sm">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-primary to-rose-500 rounded-full shadow-md"></div>
        <div className="pt-4">
          <FeaturesSection />
        </div>
        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent shadow-lg"></div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-gradient-to-b from-slate-50/50 to-background border-b-2 border-border/60 shadow-sm">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full shadow-md"></div>
        <div className="pt-4">
          <HowItWorksSection />
        </div>
        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent shadow-lg"></div>
      </section>

      {/* Testimonials Section */}
      <section className="relative bg-gradient-to-b from-background to-rose-50/40 border-b-2 border-border/60 shadow-sm">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-amber-500 to-primary rounded-full shadow-md"></div>
        <div className="pt-4">
          <TestimonialsSection />
        </div>
        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent shadow-lg"></div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-b from-rose-50/40 to-background">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-primary to-rose-500 rounded-full shadow-md"></div>
        <div className="pt-4">
          <FinalCTASection />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;