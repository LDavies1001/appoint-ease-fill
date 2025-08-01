import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Building, ArrowRight } from 'lucide-react';

export const FinalCTASection = () => {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-sage-600 via-sage-700 to-sage-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
          Ready to Transform Your 
          <span className="text-sage-200"> Booking Experience?</span>
        </h2>
        
        <p className="text-xl text-sage-100 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of customers and businesses already using OpenSlot to make booking appointments effortless.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/signup/customer" className="group">
            <Button 
              size="lg"
              className="bg-white text-sage-700 hover:bg-sage-50 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group-hover:scale-105"
            >
              <Heart className="h-6 w-6 mr-3" />
              Start as Customer
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link to="/signup/business" className="group">
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-sage-200 text-white hover:bg-sage-200 hover:text-sage-800 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group-hover:scale-105"
            >
              <Building className="h-6 w-6 mr-3" />
              Start as Business
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <p className="text-sage-200 mt-8 text-sm">
          No credit card required • Setup takes less than 5 minutes
        </p>
      </div>
    </section>
  );
};