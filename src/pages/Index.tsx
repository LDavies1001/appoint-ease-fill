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
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="relative bg-gradient-to-b from-background to-slate-50/30 border-b border-border/30">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary/50 to-rose-500/50 rounded-full"></div>
        <FeaturesSection />
      </section>

      {/* How It Works Section */}
      <section className="relative bg-gradient-to-b from-slate-50/30 to-background border-b border-border/30">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-rose-500/50 to-primary/50 rounded-full"></div>
        <HowItWorksSection />
      </section>

      {/* Testimonials Section */}
      <section className="relative bg-gradient-to-b from-background to-rose-50/20 border-b border-border/30">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary/50 to-amber-500/50 rounded-full"></div>
        <TestimonialsSection />
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-b from-rose-50/20 to-background border-b border-border/30">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-amber-500/50 to-primary/50 rounded-full"></div>
        <FinalCTASection />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;