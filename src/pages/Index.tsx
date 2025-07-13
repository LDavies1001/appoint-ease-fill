import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Star, ArrowRight, Sparkles, Clock, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FillMyHole</span>
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground mb-8">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            Trusted by 10,000+ service providers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            Fill Last-Minute
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Appointments</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            The marketplace for last-minute appointments. 
            Book services instantly or list your availability to fill empty slots.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-elegant">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>24/7 booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>Verified providers</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <Card className="p-8 text-center border-0 shadow-soft bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Instant Booking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Find and book available appointment slots in real-time. No waiting, no phone calls.
            </p>
          </Card>

          <Card className="p-8 text-center border-0 shadow-soft bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Verified Professionals</h3>
            <p className="text-muted-foreground leading-relaxed">
              All service providers are verified and rated by real customers for your peace of mind.
            </p>
          </Card>

          <Card className="p-8 text-center border-0 shadow-soft bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Quality Guaranteed</h3>
            <p className="text-muted-foreground leading-relaxed">
              Read genuine reviews and ratings to make informed decisions about your bookings.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-12 border border-border/40">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're looking to book services or offer your availability, join thousands who trust our platform.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="shadow-elegant">
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
