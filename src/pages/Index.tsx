import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Star, ArrowRight, Sparkles, Clock, Shield, Search, MapPin, User, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import heroImage from '@/assets/hero-appointment-scene.jpg';
const Index = () => {
  return <div className="min-h-screen bg-white">
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
                Find available appointment slots in seconds. Get the services you need, when you need them.
              </p>
            </div>

            {/* Search Card */}
            <Card className="p-6 shadow-soft border border-border/40">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                    <Search className="w-4 h-4 mr-2" />
                    Services
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/40">
                    <Building className="w-4 h-4 mr-2" />
                    Providers
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search for treatments" className="pl-10 h-12 text-base" />
                  </div>
                  
                  
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Any date" className="pl-10 h-12 text-base" />
                  </div>
                </div>
                
                
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

          {/* Right Side - Hero Image */}
          <div className="lg:pl-8">
            <div className="aspect-square bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl overflow-hidden relative">
              <img src={heroImage} alt="Professional appointment booking experience" className="w-full h-full object-cover" />
              {/* Floating elements */}
              <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-soft">
                
              </div>
              <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-soft">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              {/* Overlay text */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-soft max-w-xs">
                <div className="text-sm font-semibold text-foreground">Book instantly</div>
                <div className="text-xs text-muted-foreground">Available now</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 border-t border-border/40">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              
              <h3 className="text-lg font-semibold mb-2 text-foreground">Book Instantly</h3>
              <p className="text-muted-foreground text-sm">
                See what's available and book right away. No waiting around.
              </p>
            </Card>

            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Trusted People</h3>
              <p className="text-muted-foreground text-sm">
                All service providers are verified and rated by real customers.
              </p>
            </Card>

            <Card className="p-6 text-center border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Great Service</h3>
              <p className="text-muted-foreground text-sm">
                Read real reviews from customers before you book.
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
                Got Empty Appointment Slots?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Turn last-minute cancellations into bookings. List your availability and get found by customers nearby.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?tab=provider">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    <Building className="mr-2 h-5 w-5" />
                    Start Earning More
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
    </div>;
};
export default Index;