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
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                Book Last-Minute
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Appointments
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Find available appointment slots in seconds. Get the services you need, when you need them.
              </p>
            </div>

            {/* Sign Up Sections */}
            <div className="space-y-6">
              {/* Customer and Business Side by Side */}
              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                {/* Customer Section */}
                <div className="bg-card rounded-2xl p-8 border border-border/40 flex flex-col h-full">
                  <div className="text-center mb-6">
                    <User className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">For Customers</h3>
                    <p className="text-muted-foreground mb-6">Book last-minute appointments instantly</p>
                  </div>

                  {/* How It Works for Customers */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Browse Available Slots</h4>
                        <p className="text-xs text-muted-foreground">See real-time availability from verified providers near you</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Book Instantly</h4>
                        <p className="text-xs text-muted-foreground">No waiting for approval - book available slots immediately</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Read Reviews</h4>
                        <p className="text-xs text-muted-foreground">Check ratings and reviews from real customers before booking</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <Link to="/discover" className="block">
                      <Button className="w-full px-8 py-4 text-lg font-medium bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                        <Calendar className="mr-2 h-5 w-5" />
                        Find Available Slots
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/signup/customer" className="block">
                      <Button variant="outline" className="w-full px-8 py-3 text-base font-medium border-pink-200 text-pink-600 hover:bg-pink-50">
                        <User className="mr-2 h-4 w-4" />
                        Sign Up as Customer
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Business Section */}
                <div className="bg-card rounded-2xl p-8 border border-border/40 flex flex-col h-full">
                  <div className="text-center mb-6">
                    <Building className="h-12 w-12 text-accent mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">For Businesses</h3>
                    <p className="text-muted-foreground mb-6">Fill empty slots and maximize revenue</p>
                  </div>

                  {/* How It Works for Businesses */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Set Your Availability</h4>
                        <p className="text-xs text-muted-foreground">Add last-minute slots or cancellations to fill your schedule</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Get Instant Bookings</h4>
                        <p className="text-xs text-muted-foreground">Customers can book immediately without back-and-forth messaging</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Build Your Reputation</h4>
                        <p className="text-xs text-muted-foreground">Earn reviews and grow your customer base organically</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/signup/business" className="block mt-auto">
                    <Button variant="accent" className="w-full px-8 py-4 text-lg font-medium">
                      <Building className="mr-2 h-5 w-5" />
                      Join as Business
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Both Section - Full Width Below */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-border/40">
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <User className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-muted-foreground">+</span>
                    <Building className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Are You Both?</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign up as a business and you'll automatically get customer functionality too. 
                    Easily switch between managing your business and booking services for yourself.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Perfect for business owners who also want to book services from other providers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="lg:pl-8 mt-32">
            <div className="w-full bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl overflow-hidden relative">
              <img src={heroImage} alt="Professional eyelash extension service" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;