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

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?tab=signup">
                <Button className="w-full sm:w-auto px-8 py-4 text-lg font-medium">
                  <User className="mr-2 h-5 w-5" />
                  Sign Up as Customer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/auth?tab=provider">
                <Button className="w-full sm:w-auto px-8 py-4 text-lg font-medium">
                  <Building className="mr-2 h-5 w-5" />
                  Join as Business
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="grid sm:grid-cols-2 gap-6 pt-8">
              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Instant Booking</h3>
                  <p className="text-sm text-muted-foreground">Book available slots immediately without waiting</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Verified Providers</h3>
                  <p className="text-sm text-muted-foreground">All service providers are verified and rated</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Star className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Quality Service</h3>
                  <p className="text-sm text-muted-foreground">Read reviews from real customers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Building className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">For Businesses</h3>
                  <p className="text-sm text-muted-foreground">Fill empty slots and maximize revenue</p>
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

        {/* Features Section */}
        <div className="py-16 border-t border-border/40">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-medium hover:border-primary/30 transition-all duration-300">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Book Instantly</h3>
              <p className="text-muted-foreground">
                See what's available and book right away. No waiting around.
              </p>
            </Card>

            <Card className="p-8 text-center border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-medium hover:border-accent/30 transition-all duration-300">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Trusted People</h3>
              <p className="text-muted-foreground">
                All service providers are verified and rated by real customers.
              </p>
            </Card>

            <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-medium hover:border-primary/30 transition-all duration-300">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Great Service</h3>
              <p className="text-muted-foreground">
                Read real reviews from customers before you book.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;