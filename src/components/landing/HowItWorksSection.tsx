import React from 'react';
import { ArrowRight, Search, Calendar, CheckCircle } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: 'Find Available Slots',
      description: 'Browse real-time availability from local providers in your area',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Calendar,
      title: 'Book Instantly',
      description: 'Choose your preferred time and book with just a few clicks',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: CheckCircle,
      title: 'Get Confirmed',
      description: 'Receive instant confirmation and reminders for your appointment',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-gradient-to-br from-sage-50/50 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting your next appointment is as easy as 1, 2, 3
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-center">
                {/* Step Number */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-sage-100 to-sage-200 rounded-full flex items-center justify-center text-2xl font-bold text-sage-700">
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
              {index < steps.length - 1 && (
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