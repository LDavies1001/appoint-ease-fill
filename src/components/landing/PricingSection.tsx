import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Heart, Building, ArrowRight } from 'lucide-react';

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 lg:py-24 bg-gradient-to-br from-background via-sage-50/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees, no monthly subscriptions. Pay only when you book or get booked.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Customer Pricing */}
          <div className="bg-gradient-to-br from-rose-50/80 to-white/60 backdrop-blur-sm border-2 border-rose-200/50 rounded-3xl p-8 hover:shadow-xl hover:shadow-rose-100/25 transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-rose-700" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Customers</h3>
              <p className="text-muted-foreground">Book appointments with ease</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-foreground mb-2">
                Free
              </div>
              <p className="text-muted-foreground">to browse and book</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Browse all available slots',
                'Instant booking confirmation',
                'SMS and email reminders',
                'Secure payment processing',
                'Customer support'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-rose-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/signup/customer" className="block">
              <Button className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-6 text-lg rounded-xl">
                Get Started as Customer
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Business Pricing */}
          <div className="bg-gradient-to-br from-sage-50/80 to-white/60 backdrop-blur-sm border-2 border-sage-300/60 rounded-3xl p-8 hover:shadow-xl hover:shadow-sage-100/25 transition-all duration-300 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-sage-500 to-sage-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8 pt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-sage-200 to-sage-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-sage-700" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Businesses</h3>
              <p className="text-muted-foreground">Fill your empty slots</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-foreground mb-2">
                15%
              </div>
              <p className="text-muted-foreground">commission per booking</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Unlimited slot listings',
                'Automatic booking management',
                'Real-time calendar sync',
                'Customer communication tools',
                'Analytics and insights',
                'Priority customer support'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-sage-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/signup/business" className="block">
              <Button className="w-full bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white py-6 text-lg rounded-xl">
                Get Started as Business
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust Note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            ✓ No setup fees ✓ No monthly charges ✓ Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};