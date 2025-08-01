import React from 'react';

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-12 lg:py-16 bg-gradient-to-br from-background to-rose-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real feedback from customers and businesses using OpenSlot
          </p>
        </div>

        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-muted/50 to-muted/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No reviews yet!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Be one of the first to experience OpenSlot and help us build something amazing together. 
              Your feedback will help shape the future of appointment booking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};