import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Calendar, Star, MapPin, Lock, Award, Heart, Building, CheckCircle, Clock, Users, ArrowRight, Sparkles, Zap, Search } from 'lucide-react';

import heroImage from '@/assets/hero-marketplace-scene.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-x-hidden w-full">
      {/* Hero Banner */}
      <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]"></div>
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left Content - Hero Copy */}
            <div className="space-y-8 text-center lg:text-left animate-fade-in">
              {/* Attention Grabber */}
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Fill Last-Minute Slots Instantly</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-foreground">
                  Stop Chasing
                  <span className="block text-primary">Bookings</span>
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto lg:mx-0">
                  The marketplace that connects customers with <span className="text-primary font-semibold">last-minute availability</span>
                </p>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Instant bookings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Reach new customers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Fill empty slots</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Reduce no-shows</span>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup/business" className="group flex-1">
                    <Button size="lg" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl group-hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Start Filling Slots
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/signup/customer" className="group flex-1">
                    <Button size="lg" variant="outline" className="w-full h-14 text-lg font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl group-hover:scale-105 transition-all duration-200">
                      Find Appointments
                      <Heart className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                
                {/* Social Proof */}
                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Secure & Trusted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>UK Based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Instant Setup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative animate-scale-in order-first lg:order-last">
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                {/* Main Image */}
                <div className="relative">
                  <img 
                    src={heroImage} 
                    alt="Professional service appointment" 
                    className="w-full h-auto rounded-3xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-3xl"></div>
                </div>
                
                {/* Floating Stats Cards */}
                <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Instant Booking</div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Live Availability</div>
                      <div className="text-xs text-muted-foreground">Real-time updates</div>
                    </div>
                  </div>
                </div>
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