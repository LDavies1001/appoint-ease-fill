import React, { useState } from 'react';
import { ArrowRight, Search, Calendar, CheckCircle, Store, Users, BarChart3, Heart, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'businesses'>('customers');

  const customerSteps = [
    {
      icon: Search,
      title: 'Find Available Slots',
      description: 'Browse real-time availability from local providers in your area',
      color: 'from-rose-500 to-rose-600'
    },
    {
      icon: Calendar,
      title: 'Book Instantly',
      description: 'Choose your preferred time and book with just a few clicks',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: CheckCircle,
      title: 'Get Confirmed',
      description: 'Receive instant confirmation and reminders for your appointment',
      color: 'from-green-500 to-green-600'
    }
  ];

  const businessSteps = [
    {
      icon: Store,
      title: 'Set Up Your Profile',
      description: 'Create your business profile and showcase your services',
      color: 'from-sage-500 to-sage-600'
    },
    {
      icon: Users,
      title: 'Manage Availability',
      description: 'Set your schedule and let customers book available slots',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: BarChart3,
      title: 'Grow Your Business',
      description: 'Track bookings, manage clients, and expand your reach',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const currentSteps = activeTab === 'customers' ? customerSteps : businessSteps;

  return (
    <section id="how-it-works" className="py-12 lg:py-16 bg-gradient-to-br from-sage-50/50 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple steps for customers and businesses to get started
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-background rounded-xl p-1 border border-border/40 shadow-sm">
            <Button
              variant={activeTab === 'customers' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'customers' 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className="h-4 w-4 mr-2" />
              For Customers
            </Button>
            <Button
              variant={activeTab === 'businesses' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('businesses')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'businesses' 
                  ? 'bg-sage-100 text-sage-700 hover:bg-sage-200' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building className="h-4 w-4 mr-2" />
              For Businesses
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {currentSteps.map((step, index) => (
            <div key={`${activeTab}-${index}`} className="relative animate-in fade-in-50 duration-500">
              <div className="text-center">
                {/* Step Number */}
                <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br rounded-full flex items-center justify-center text-2xl font-bold ${
                  activeTab === 'customers' 
                    ? 'from-rose-100 to-rose-200 text-rose-700' 
                    : 'from-sage-100 to-sage-200 text-sage-700'
                }`}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>

              {/* Arrow for desktop */}
              {index < currentSteps.length - 1 && (
                <div className="hidden lg:block absolute top-24 -right-6 transform translate-x-full">
                  <ArrowRight className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};