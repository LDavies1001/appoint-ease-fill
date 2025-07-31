import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Star, Shield, User, Building, ArrowRight, Heart, Sparkles, CheckCircle, Search, MapPin, Lock, Award } from 'lucide-react';

import heroImage from '@/assets/hero-lash-extension.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden w-full">
      {/* Hero Section */}
      <div className="w-full px-1 sm:px-4 lg:px-6 xl:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-12 xl:gap-16 items-center py-4 sm:py-8 lg:py-16 xl:py-20 min-h-[85vh] w-full">
            {/* Left Side - Content */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full px-1 sm:px-0">
              {/* Main Headline */}
              <div className="space-y-4 lg:space-y-6">
                <h1 className="font-bold text-foreground leading-tight" style={{ fontSize: 'clamp(1.5rem, 6vw, 3.5rem)' }}>
                  Fill Your Empty Appointments — <span className="text-sage-600">Automatically</span>.
                </h1>
                
                <p className="text-muted-foreground leading-relaxed max-w-full lg:max-w-2xl" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)' }}>
                  OpenSlot connects your last-minute availability with real, local customers — no more chasing bookings through DMs.
                </p>
              </div>

              {/* Dual CTA Section */}
              <div className="space-y-4 lg:space-y-6 w-full">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  {/* Business CTA */}
                  <Link to="/signup/business" className="group flex-1">
                    <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300 hover:from-sage-200 hover:via-sage-300 hover:to-sage-400 text-sage-800 border-0 rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-sage-200/25 hover:-translate-y-1">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Building className="h-6 w-6 lg:h-8 lg:w-8" />
                        <span className="font-bold text-lg lg:text-xl">I'm a Business</span>
                      </div>
                    </Button>
                  </Link>

                  {/* Customer CTA */}
                  <Link to="/signup/customer" className="group flex-1">
                    <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300 hover:from-rose-200 hover:via-rose-300 hover:to-rose-400 text-rose-800 border-0 rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-rose-200/25 hover:-translate-y-1">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Heart className="h-6 w-6 lg:h-8 lg:w-8" />
                        <span className="font-bold text-lg lg:text-xl">I'm a Customer</span>
                      </div>
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 text-sage-600" />
                    <span>Made in the UK</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="h-4 w-4 text-sage-600" />
                    <span>Secure booking platform</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Award className="h-4 w-4 text-sage-600" />
                    <span>No app needed</span>
                  </div>
                </div>

                {/* Founder Quote */}
                <div className="bg-gradient-to-r from-sage-50 to-rose-50 border border-sage-200/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 w-full">
                  <div className="text-center space-y-3">
                    <blockquote className="text-foreground font-medium leading-relaxed italic" style={{ fontSize: 'clamp(0.875rem, 2.8vw, 1.125rem)' }}>
                      "Built for small business owners who deserve better than DMs and no-shows."
                    </blockquote>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-sage-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">L</span>
                      </div>
                      <span className="text-sage-700 font-medium text-sm">— Laura, Founder of OpenSlot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="lg:order-last order-first animate-scale-in w-full max-w-full px-2 sm:px-0">
              <div className="relative max-w-full">
                <img 
                  src={heroImage} 
                  alt="Professional beauty appointment" 
                  className="w-full h-auto rounded-2xl lg:rounded-3xl shadow-elegant max-w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl lg:rounded-3xl"></div>
                
                {/* Floating testimonial */}
                <div className="absolute bottom-3 left-3 right-3 lg:bottom-6 lg:left-6 lg:right-6 bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 shadow-lg">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-gray-800 truncate">4.9/5 from 1000+ bookings</span>
                  </div>
                  <p className="text-xs lg:text-sm text-gray-600 mt-1 lg:mt-2 line-clamp-2">"Found the perfect last-minute slot for my nails!"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-8 lg:py-16 bg-muted/30 w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 overflow-hidden">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4 break-words">How OpenSlot Works</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Simple, fast, and effective for both customers and business owners
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Customer Flow */}
            <div className="text-center space-y-3 lg:space-y-4 px-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Browse & Discover</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Find available appointment slots near you in real-time</p>
            </div>

            <div className="text-center space-y-3 lg:space-y-4 px-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Book Instantly</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Secure your slot with one click—no waiting for confirmation</p>
            </div>

            <div className="text-center space-y-3 lg:space-y-4 px-2 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-provider to-provider-glow rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Grow Your Business</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Fill empty slots automatically and build your client base</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;