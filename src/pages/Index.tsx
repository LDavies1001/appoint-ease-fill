import React from 'react';
import { Calendar, Star, Search, MapPin, Building, CheckCircle } from 'lucide-react';
import { HeroContainer } from '@/components/hero/HeroContainer';
import { HeroContent } from '@/components/hero/HeroContent';
import { HeroImage } from '@/components/hero/HeroImage';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden w-full">
      {/* Hero Section with integrated sticky header */}
      <HeroContainer>
        <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr,0.9fr] gap-12 lg:gap-20 xl:gap-24 items-center py-12 sm:py-16 lg:py-24 xl:py-32 min-h-[95vh] w-full">
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

      {/* Pricing Section */}
      <PricingSection />

      {/* Customer Benefits Section */}
      <section className="py-8 lg:py-16 bg-gradient-to-br from-rose-50 via-rose-25 to-background w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 overflow-hidden">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4">Perfect for Last-Minute Bookings</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Get the appointment you need, when you need it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* Instant Availability */}
            <div className="bg-white/60 backdrop-blur-sm border border-rose-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-rose-50/50 transition-all duration-300">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-rose-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">Real-Time Availability</h3>
              <p className="text-sm lg:text-base text-muted-foreground">See exactly what's available right now - no waiting for callbacks or confirmations</p>
            </div>

            {/* Discover Local */}
            <div className="bg-white/60 backdrop-blur-sm border border-rose-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-rose-50/50 transition-all duration-300">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-rose-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">Discover Local Gems</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Find amazing local providers you might never have discovered otherwise</p>
            </div>

            {/* Better Prices */}
            <div className="bg-white/60 backdrop-blur-sm border border-rose-100/50 rounded-xl lg:rounded-2xl p-6 text-center space-y-4 hover:shadow-lg hover:shadow-rose-50/50 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 lg:h-8 lg:w-8 text-rose-700" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">Great Last-Minute Deals</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Providers often offer special rates for last-minute bookings - win-win!</p>
            </div>
          </div>

        </div>
      </section>

      {/* Business Benefits Section */}
      <section className="py-8 lg:py-16 bg-gradient-to-br from-sage-50 via-sage-25 to-background w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 overflow-hidden">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4">Turn Empty Slots Into Revenue</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Stop chasing bookings through DMs and social media
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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