import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Star, Shield, User, Building, ArrowRight, Heart, Sparkles, CheckCircle, Search } from 'lucide-react';
import Header from '@/components/ui/header';
import heroImage from '@/assets/hero-lash-extension.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-12 lg:py-20 min-h-[85vh]">
          {/* Left Side - Content */}
          <div className="space-y-10 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-muted/50 border border-border/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Last-minute beauty appointments made easy</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Find & fill beauty appointments with <span className="text-primary">OpenSlot</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Connect instantly with local beauty providers. Book last-minute slots or fill your empty calendar—all in one platform.
              </p>
            </div>

            {/* Enhanced Dual CTA Section */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Customer CTA */}
                <Link to="/signup/customer" className="group">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Join as a Customer</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">Book last-minute beauty appointments with trusted local providers</p>
                    <Button variant="hero" size="lg" className="w-full mt-auto">
                      Get Started
                    </Button>
                  </div>
                </Link>

                {/* Business CTA */}
                <Link to="/signup/business" className="group">
                  <div className="bg-gradient-to-br from-provider/10 to-provider/5 border-2 border-provider/20 rounded-2xl p-6 hover:border-provider/40 transition-all duration-300 hover:shadow-lg hover:shadow-provider/10 hover:-translate-y-1 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-provider to-provider-glow rounded-xl flex items-center justify-center">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-provider group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Sign Up as Business</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">Fill empty slots and grow your business with instant bookings</p>
                    <Button variant="provider-hero" size="lg" className="w-full mt-auto">
                      Join Now
                    </Button>
                  </div>
                </Link>
              </div>

              {/* Both Section */}
              <div className="bg-gradient-to-r from-muted/40 to-muted/20 border border-border/30 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-tertiary to-background rounded-xl flex items-center justify-center flex-shrink-0 border border-border/50">
                    <User className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Dual Benefits</h3>
                    <p className="text-muted-foreground text-sm">
                      Business owners automatically get customer access—book appointments while managing your own slots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="lg:order-last order-first animate-scale-in">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Professional beauty appointment" 
                className="w-full h-auto rounded-3xl shadow-elegant"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              
              {/* Floating testimonial */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-800">4.9/5 from 1000+ bookings</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">"Found the perfect last-minute slot for my nails!"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How OpenSlot Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, fast, and effective for both customers and business owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Customer Flow */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Browse & Discover</h3>
              <p className="text-muted-foreground">Find available appointment slots near you in real-time</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Book Instantly</h3>
              <p className="text-muted-foreground">Secure your slot with one click—no waiting for confirmation</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-provider to-provider-glow rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Grow Your Business</h3>
              <p className="text-muted-foreground">Fill empty slots automatically and build your client base</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;