import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Building, CheckCircle, MapPin, Lock, Award } from 'lucide-react';

export const HeroContent = () => {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Main Headline */}
      <div className="space-y-4 lg:space-y-6">
        <h1 className="font-bold text-foreground leading-[1.1] tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
          Find & Fill Last-Minute{' '}
          <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-sage-300 to-sage-500 bg-clip-text text-transparent">
            Appointments
          </span>
        </h1>
        
        <p className="text-muted-foreground leading-relaxed max-w-2xl text-lg lg:text-xl font-medium">
          <span className="text-foreground font-semibold">Customers:</span> Discover available slots near you instantly
          <br />
          <span className="text-foreground font-semibold">Businesses:</span> Fill empty appointments automatically
        </p>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Customer Value */}
        <div className="group relative bg-gradient-to-br from-rose-50/80 via-white/60 to-rose-100/80 backdrop-blur-sm border border-rose-200/40 rounded-2xl p-4 lg:p-6 hover:shadow-xl hover:shadow-rose-100/25 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-rose-100/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-rose-700" />
              </div>
              <h3 className="font-bold text-xl text-foreground">For Customers</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Book instantly, no waiting',
                'Discover local providers', 
                'Great last-minute deals'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Business Value */}
        <div className="group relative bg-gradient-to-br from-sage-50/80 via-white/60 to-sage-100/80 backdrop-blur-sm border border-sage-200/40 rounded-2xl p-4 lg:p-6 hover:shadow-xl hover:shadow-sage-100/25 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-sage-50/0 to-sage-100/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-200 to-sage-300 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-sage-700" />
              </div>
              <h3 className="font-bold text-xl text-foreground">For Businesses</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Fill empty slots automatically',
                'No more chasing bookings',
                'Reduce no-shows'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-sage-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <Link to="/signup/customer" className="group flex-1">
            <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300 hover:from-rose-200 hover:via-rose-300 hover:to-rose-400 text-rose-800 border-0 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-rose-200/30 hover:-translate-y-2 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center space-y-2">
                <Heart className="h-8 w-8 lg:h-10 lg:w-10 transition-transform group-hover:scale-110" />
                <span className="font-bold text-xl lg:text-2xl">I'm a Customer</span>
                <span className="text-sm text-rose-600 opacity-80">Find available appointments</span>
              </div>
            </Button>
          </Link>

          <Link to="/signup/business" className="group flex-1">
            <Button className="w-full h-auto p-4 lg:p-6 bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300 hover:from-sage-200 hover:via-sage-300 hover:to-sage-400 text-sage-800 border-0 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-sage-200/30 hover:-translate-y-2 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center space-y-2">
                <Building className="h-8 w-8 lg:h-10 lg:w-10 transition-transform group-hover:scale-110" />
                <span className="font-bold text-xl lg:text-2xl">I'm a Business</span>
                <span className="text-sm text-sage-600 opacity-80">Fill empty appointments</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-8 py-4">
          {[
            { icon: MapPin, text: 'Made in the UK' },
            { icon: Lock, text: 'Secure booking platform' },
            { icon: Award, text: 'Instant bookings' }
          ].map((badge, index) => (
            <div key={index} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
              <badge.icon className="h-5 w-5 text-sage-400" />
              <span className="font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};