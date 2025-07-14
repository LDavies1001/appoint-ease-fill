import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Star, ArrowRight, Sparkles, Clock, Shield, Search, MapPin, User, Building, Navigation } from 'lucide-react';
import { LocationInput } from '@/components/ui/location-input';
import { Input } from '@/components/ui/input';
import heroImage from '@/assets/hero-lash-extension.jpg';

const Index = () => {
  const [selectedPanel, setSelectedPanel] = useState<'customer' | 'business' | null>(null);

  const getMainHeading = () => {
    if (selectedPanel === 'customer') {
      return 'Book Last-Minute Appointments';
    } else if (selectedPanel === 'business') {
      return 'Fill Your Empty Slots';
    }
    return 'Book Last-Minute Appointments';
  };

  const getSubHeading = () => {
    if (selectedPanel === 'customer') {
      return 'Find available appointment slots in seconds. Get the services you need, when you need them.';
    } else if (selectedPanel === 'business') {
      return 'Turn cancellations into revenue. Connect with customers looking for immediate appointments and maximize your booking potential.';
    }
    return 'Find available appointment slots in seconds. Get the services you need, when you need them.';
  };
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
              <Link to="/auth?tab=business-signup">
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
                 {selectedPanel === 'business' ? 'Fill Your Empty' : 'Book Last-Minute'}
                 <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                   {selectedPanel === 'business' ? 'Slots' : 'Appointments'}
                 </span>
               </h1>
               <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                 {getSubHeading()}
               </p>
             </div>

            {/* Split Sign Up Forms */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer Sign Up Panel */}
              <Card 
                className={`p-6 shadow-soft border-2 cursor-pointer transition-all duration-300 ${
                  selectedPanel === 'customer' 
                    ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/30 shadow-medium' 
                    : 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30'
                }`}
                onClick={() => setSelectedPanel('customer')}
              >
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">For Customers</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Start Booking Today</h3>
                    <p className="text-sm text-muted-foreground">Join thousands of satisfied customers</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Your Name" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Email address" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <LocationInput 
                      placeholder="Your Location" 
                      className="h-11 text-sm bg-white/80" 
                    />
                    
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Confirm Password" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                  </div>
                  
                  <Link to="/auth?tab=signup" className="block">
                    <Button className="w-full h-11 text-sm font-medium">
                      Sign Up as Customer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Business Sign Up Panel */}
              <Card 
                className={`p-6 shadow-soft border-2 cursor-pointer transition-all duration-300 ${
                  selectedPanel === 'business' 
                    ? 'border-accent bg-gradient-to-br from-accent/20 to-accent/30 shadow-medium' 
                    : 'border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:border-accent/30'
                }`}
                onClick={() => setSelectedPanel('business')}
              >
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Building className="h-5 w-5 text-accent" />
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider">For Businesses</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Grow Your Business</h3>
                    <p className="text-sm text-muted-foreground">Fill your empty appointment slots instantly</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Business Name" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Business Email" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <LocationInput 
                      placeholder="Business Location" 
                      className="h-11 text-sm bg-white/80" 
                    />
                    
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                    
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Confirm Password" className="pl-10 h-11 text-sm bg-white/80" />
                    </div>
                  </div>
                  
                  <Link to="/auth?tab=business-signup" className="block">
                    <Button className="w-full h-11 text-sm font-medium bg-accent hover:bg-accent/90 text-accent-foreground">
                      Register Your Business
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="lg:pl-8 flex items-end">
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