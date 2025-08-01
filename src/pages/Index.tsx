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

      {/* Business Benefits Section */}
      <section className="py-6 lg:py-12 bg-gradient-to-br from-sage-50 via-sage-25 to-background w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 overflow-hidden">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4">Turn Empty Slots Into Revenue</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Stop chasing bookings through DMs and social media
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Auto-Fill */}
            <div className="bg-white/60 backdrop-blur-sm border border-sage-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-sage-50/50 transition-all duration-300">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 lg:h-8 lg:w-8 text-sage-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">Auto-Fill Empty Slots</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Customers find and book your availability automatically - no more manual work</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border border-sage-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-sage-50/50 transition-all duration-300">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl flex items-center justify-center mx-auto">
                <Building className="h-6 w-6 lg:h-8 lg:w-8 text-sage-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">Grow Your Business</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Reach new customers who are actively looking for services like yours</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border border-sage-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-sage-50/50 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-sage-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">No More No-Shows</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Instant bookings mean committed customers - reduce cancellations and no-shows</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  );
};

export default Index;