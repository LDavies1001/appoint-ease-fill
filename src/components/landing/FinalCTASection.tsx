import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Building, ArrowRight } from 'lucide-react';

export const FinalCTASection = () => {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-sage-50 via-sage-100 to-sage-200 text-sage-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
          Ready to Transform Your 
          <span className="text-sage-600"> Booking Experience?</span>
        </h2>
        
          <p className="text-xl text-sage-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Be among the first to experience the future of appointment booking. Join our growing community and transform how you manage your schedule.
          </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/signup/customer" className="group">
            <Button 
              size="lg"
              className="bg-gradient-to-br from-rose-200 to-rose-300 text-rose-800 hover:from-rose-300 hover:to-rose-400 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group-hover:scale-105"
            >
              <Heart className="h-6 w-6 mr-3" />
              Start as Customer
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link to="/signup/business" className="group">
            <Button 
              size="lg"
              className="bg-gradient-to-br from-sage-500 to-sage-600 text-white hover:from-sage-600 hover:to-sage-700 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group-hover:scale-105"
            >
              <Building className="h-6 w-6 mr-3" />
              Start as Business
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <p className="text-sage-600 mt-8 text-sm">
          Setup takes less than 5 minutes
        </p>
      </div>
    </section>
  );
};