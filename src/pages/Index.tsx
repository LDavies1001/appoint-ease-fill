import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Star, Shield, User, Building, ArrowRight, Heart, Sparkles, CheckCircle, Search, MapPin, Lock, Award } from 'lucide-react';

import heroImage from '@/assets/hero-marketplace-scene.jpg';

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
                  Find & Fill Last-Minute <span className="text-sage-200">Appointments</span>
                </h1>
                
                <p className="text-muted-foreground leading-relaxed max-w-full lg:max-w-2xl" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)' }}>
                  <span className="font-semibold">Customers:</span> Discover available slots near you instantly<br/>
                  <span className="font-semibold">Businesses:</span> Fill empty appointments automatically
                </p>
              </div>

              {/* Dual Value Proposition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
                {/* Customer Value */}
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/50 rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Heart className="h-6 w-6 text-rose-600" />
                    <h3 className="font-bold text-lg text-foreground">For Customers</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <span>Book instantly, no waiting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <span>Discover local providers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <span>Great last-minute deals</span>
                    </li>
                  </ul>
                </div>

                {/* Business Value */}
                <div className="bg-gradient-to-br from-sage-50 to-sage-100 border border-sage-200/50 rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Building className="h-6 w-6 text-sage-600" />
                    <h3 className="font-bold text-lg text-foreground">For Businesses</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-sage-500 flex-shrink-0" />
                      <span>Fill empty slots automatically</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-sage-500 flex-shrink-0" />
                      <span>No more chasing bookings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-sage-500 flex-shrink-0" />
                      <span>Reduce no-shows</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Dual CTA Section */}
              <div className="space-y-4 lg:space-y-6 w-full">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  {/* Customer CTA */}
                  <Link to="/signup/customer" className="group flex-1">
                    <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200 hover:from-rose-100 hover:via-rose-200 hover:to-rose-300 text-rose-700 border-0 rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-rose-100/25 hover:-translate-y-1">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Heart className="h-6 w-6 lg:h-8 lg:w-8" />
                        <span className="font-bold text-lg lg:text-xl">I'm a Customer</span>
                      </div>
                    </Button>
                  </Link>

                  {/* Business CTA */}
                  <Link to="/signup/business" className="group flex-1">
                    <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-sage-50 via-sage-100 to-sage-200 hover:from-sage-100 hover:via-sage-200 hover:to-sage-300 text-sage-700 border-0 rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-sage-100/25 hover:-translate-y-1">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Building className="h-6 w-6 lg:h-8 lg:w-8" />
                        <span className="font-bold text-lg lg:text-xl">I'm a Business</span>
                      </div>
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 text-sage-200" />
                    <span>Made in the UK</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="h-4 w-4 text-sage-200" />
                    <span>Secure booking platform</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Award className="h-4 w-4 text-sage-200" />
                    <span>Instant bookings</span>
                  </div>
                </div>

                {/* Founder Quote */}
                <div className="bg-gradient-to-r from-sage-50 via-background to-rose-50 border border-sage-100/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 w-full">
                  <div className="text-center space-y-3">
                    <blockquote className="text-foreground font-medium leading-relaxed italic" style={{ fontSize: 'clamp(0.875rem, 2.8vw, 1.125rem)' }}>
                      "Built for small business owners who deserve better than DMs and no-shows."
                    </blockquote>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-sage-100 to-sage-200 rounded-full flex items-center justify-center">
                        <span className="text-sage-700 font-bold text-sm">L</span>
                      </div>
                      <span className="text-sage-600 font-medium text-sm">— Laura, Founder of OpenSlot</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>

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

          {/* Customer Testimonial */}
          <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200/50 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-rose-500 fill-current" />
              ))}
            </div>
            <blockquote className="text-lg lg:text-xl font-medium text-rose-800 italic mb-4">
              "I got a last-minute nail appointment for tonight's date - saved my evening!"
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center">
                <span className="text-rose-800 font-bold">S</span>
              </div>
              <span className="text-rose-700 font-medium">— Sarah, OpenSlot Customer</span>
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
    </div>
  );
};

export default Index;