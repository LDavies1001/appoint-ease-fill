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
      <section className="relative animate-fade-in">
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
      </section>

      {/* Features Section */}
      <section className="relative py-16 lg:py-24 animate-fade-in">
        <div className="absolute top-0 left-8 lg:left-16">
          <div className="text-6xl lg:text-8xl font-black text-primary/10 select-none">01</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-lg p-8 lg:p-12">
            <FeaturesSection />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-muted/30 to-accent/10 animate-fade-in">
        <div className="absolute top-0 right-8 lg:right-16">
          <div className="text-6xl lg:text-8xl font-black text-secondary/15 select-none">02</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-lg p-8 lg:p-12">
            <HowItWorksSection />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 lg:py-24 animate-fade-in">
        <div className="absolute top-0 left-8 lg:left-16">
          <div className="text-6xl lg:text-8xl font-black text-accent/15 select-none">03</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-3xl shadow-lg p-8 lg:p-12">
            <TestimonialsSection />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-secondary/5 animate-fade-in">
        <div className="absolute top-0 right-8 lg:right-16">
          <div className="text-6xl lg:text-8xl font-black text-primary/15 select-none">04</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl p-8 lg:p-12">
            <FinalCTASection />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;