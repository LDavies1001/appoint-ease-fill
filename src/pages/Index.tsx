import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Star, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/10">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Fill<span className="text-primary">My</span>Hole
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with service providers for spontaneous appointments. 
            Find last-minute slots or offer your availability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="card-elegant p-6 text-center">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Flexible Booking</h3>
            <p className="text-muted-foreground">
              Find available slots that fit your schedule or post your own availability
            </p>
          </Card>

          <Card className="card-elegant p-6 text-center">
            <Users className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trusted Providers</h3>
            <p className="text-muted-foreground">
              Connect with verified service providers in your area
            </p>
          </Card>

          <Card className="card-elegant p-6 text-center">
            <Star className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quality Service</h3>
            <p className="text-muted-foreground">
              Read reviews and ratings to make informed decisions
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
