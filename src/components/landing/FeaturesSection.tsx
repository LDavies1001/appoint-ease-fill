import React from 'react';
import { Star, Users, Clock, Shield, Zap, Heart } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: 'Instant Booking',
      description: 'Book available appointments in seconds, no back-and-forth messaging needed.',
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'Local Discovery',
      description: 'Find amazing providers in your area you might never have discovered.',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: 'Last-Minute Deals',
      description: 'Get great prices on appointments that would otherwise go empty.',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your bookings and payments are protected with enterprise-grade security.',
      color: 'text-purple-600'
    },
    {
      icon: Star,
      title: 'Quality Providers',
      description: 'All providers are verified and rated by real customers.',
      color: 'text-orange-600'
    },
    {
      icon: Heart,
      title: 'No Hidden Fees',
      description: 'What you see is what you pay - transparent pricing always.',
      color: 'text-rose-600'
    }
  ];

  return (
    <section id="features" className="py-12 lg:py-16 bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Choose OpenSlot?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connecting customers with available appointments and helping businesses fill their schedules effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:shadow-lg hover:shadow-muted/25 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color.split('-')[1]}-100 to-${feature.color.split('-')[1]}-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};