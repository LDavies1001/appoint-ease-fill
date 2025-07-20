import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Star, Shield, User, Building, ArrowRight } from 'lucide-react';
import Header from '@/components/ui/header';
import heroImage from '@/assets/hero-lash-extension.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 items-center py-4 lg:py-6">
          {/* Left Side - Content */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
                Book Last-Minute
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Appointments
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Find available appointment slots in seconds. Get the services you need, when you need them.
              </p>
            </div>

            {/* Sign Up Sections */}
            <div className="space-y-3">
              {/* Customer and Business Side by Side */}
              <div className="grid md:grid-cols-2 gap-4 items-stretch">
                {/* Customer Section */}
                <div className="bg-card rounded-lg p-4 border border-border/40 flex flex-col h-full">
                  <div className="text-center mb-3">
                    <User className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-foreground mb-1">For Customers</h3>
                    <p className="text-sm text-muted-foreground mb-3">Book last-minute appointments instantly</p>
                  </div>

                  {/* How It Works for Customers */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Browse Available Slots</h4>
                        <p className="text-xs text-muted-foreground">See real-time availability from verified providers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Book Instantly</h4>
                        <p className="text-xs text-muted-foreground">No waiting for approval - book available slots immediately</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Read Reviews</h4>
                        <p className="text-xs text-muted-foreground">Check ratings from real customers before booking</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/auth?tab=signup" className="block mt-auto">
                    <Button className="w-full px-4 py-3 text-sm font-medium">
                      <User className="mr-1 h-4 w-4" />
                      Sign Up as Customer
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Business Section */}
                <div className="bg-card rounded-lg p-4 border border-border/40 flex flex-col h-full">
                  <div className="text-center mb-3">
                    <Building className="h-8 w-8 text-accent mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-foreground mb-1">For Businesses</h3>
                    <p className="text-sm text-muted-foreground mb-3">Fill empty slots and maximize revenue</p>
                  </div>

                  {/* How It Works for Businesses */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Set Your Availability</h4>
                        <p className="text-xs text-muted-foreground">Add last-minute slots or cancellations to fill your schedule</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Get Instant Bookings</h4>
                        <p className="text-xs text-muted-foreground">Customers can book immediately without back-and-forth messaging</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">Build Your Reputation</h4>
                        <p className="text-xs text-muted-foreground">Earn reviews and grow your customer base organically</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/auth?tab=provider" className="block mt-auto">
                    <Button variant="accent" className="w-full px-4 py-3 text-sm font-medium">
                      <Building className="mr-1 h-4 w-4" />
                      Join as Business
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Both Section - Full Width Below */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-border/40">
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <User className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold text-muted-foreground">+</span>
                    <Building className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Are You Both?</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sign up as a business and you'll automatically get customer functionality too. 
                    Easily switch between managing your business and booking services for yourself.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Perfect for business owners who also want to book services from other providers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="lg:pl-4">
            <div className="w-full bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-2xl overflow-hidden relative">
              <img src={heroImage} alt="Professional eyelash extension service" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;