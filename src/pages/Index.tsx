import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Star, ArrowRight, Sparkles, Clock, Shield, Search, MapPin, User, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-border/40 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">FillMyHole</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth?tab=provider">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  For Your Business
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/* Left Side - Search Interface */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                Book Last-Minute
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Appointments
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Find available appointment slots in seconds. Professional services when you need them.
              </p>
            </div>

            {/* Search Card */}
            <Card className="p-6 shadow-soft border border-border/40">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Services
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/40"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Providers
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for treatments"
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter location"
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Any date"
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>
                
                <Button variant="hero" size="lg" className="w-full h-12 text-base font-semibold">
                  Search Available Slots
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <span className="text-sm text-muted-foreground">Popular:</span>
              <button className="text-sm text-primary hover:underline">Haircut</button>
              <button className="text-sm text-primary hover:underline">Massage</button>
              <button className="text-sm text-primary hover:underline">Nails</button>
              <button className="text-sm text-primary hover:underline">Facial</button>
            </div>
          </div>

          {/* Right Side - Hero Image Placeholder */}
          <div className="lg:pl-8">
            <div className="aspect-square bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 rounded-3xl flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">5-Star Service</h3>
                  <p className="text-muted-foreground">Trusted by thousands</p>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute top-8 right-8 bg-white rounded-full p-3 shadow-soft">
                <Star className="h-6 w-6 text-accent fill-accent" />
              </div>
              <div className="absolute bottom-8 left-8 bg-white rounded-full p-3 shadow-soft">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 border-t border-border/40">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose FillMyHole?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The professional way to book and offer appointment services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Instant Booking</h3>
              <p className="text-muted-foreground text-sm">
                Book available slots immediately. No waiting for confirmations.
              </p>
            </Card>

            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Verified Providers</h3>
              <p className="text-muted-foreground text-sm">
                All professionals are verified and rated for quality assurance.
              </p>
            </Card>

            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Quality Guaranteed</h3>
              <p className="text-muted-foreground text-sm">
                Read authentic reviews from real customers before booking.
              </p>
            </Card>
          </div>
        </div>

        {/* Business CTA Section */}
        <div className="py-16 border-t border-border/40">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 lg:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Building className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">For Businesses</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Fill Your Empty Appointment Slots
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Turn last-minute cancellations into revenue. List your availability and get booked by customers nearby.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?tab=provider">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    <Building className="mr-2 h-5 w-5" />
                    Join as Provider
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
