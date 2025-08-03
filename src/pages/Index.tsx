import React from 'react';
import { Calendar, Star, Search, MapPin, Building, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { HeroContainer } from '@/components/hero/HeroContainer';
import { HeroContent } from '@/components/hero/HeroContent';
import { HeroImage } from '@/components/hero/HeroImage';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

import { FinalCTASection } from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  const { user, profile } = useAuth();
  
  // Use route protection to handle logged in users
  useRouteProtection();
  
  console.log('Index page - Auth state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    profileComplete: profile?.is_profile_complete 
  });

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
      <section id="features" className="relative py-6 lg:py-8 animate-fade-in">
        <div className="absolute top-4 left-8 lg:left-16 z-10">
          <div className="text-3xl lg:text-5xl font-black text-primary/20 select-none">01</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative z-10">
              <FeaturesSection />
            </div>
          </div>
        </div>
        {/* Connecting visual element */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full shadow-lg border-4 border-background"></div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-6 lg:py-8 bg-gradient-to-br from-muted/20 to-accent/5 animate-fade-in">
        <div className="absolute top-4 right-8 lg:right-16 z-10">
          <div className="text-3xl lg:text-5xl font-black text-secondary/25 select-none">02</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-md border border-secondary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent"></div>
            <div className="relative z-10">
              <HowItWorksSection />
            </div>
          </div>
        </div>
        {/* Connecting visual element */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20">
          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-full shadow-lg border-4 border-background"></div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-6 lg:py-8 animate-fade-in">
        <div className="absolute top-4 left-8 lg:left-16 z-10">
          <div className="text-3xl lg:text-5xl font-black text-accent/25 select-none">03</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-accent/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
            <div className="relative z-10">
              <TestimonialsSection />
            </div>
          </div>
        </div>
        {/* Connecting visual element */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full shadow-lg border-4 border-background"></div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-6 lg:py-8 bg-gradient-to-br from-primary/8 to-secondary/8 animate-fade-in">
        <div className="absolute top-4 right-8 lg:right-16 z-10">
          <div className="text-3xl lg:text-5xl font-black text-primary/25 select-none">04</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-md border border-primary/25 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-secondary/5"></div>
            <div className="relative z-10">
              <FinalCTASection />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;