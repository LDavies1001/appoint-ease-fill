import React from 'react';
import { Star, Quote } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Busy Professional',
      content: 'Finally found a way to book last-minute appointments! Saved my weekend when I needed a quick haircut.',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'Marcus Chen',
      role: 'Lash Technician',
      content: 'My cancellations used to mean lost revenue. Now they get filled automatically. Game changer!',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'Emma Williams',
      role: 'Working Mum',
      content: 'Love being able to find appointments during school hours. The platform is so easy to use.',
      rating: 5,
      avatar: 'EW'
    }
  ];

  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-gradient-to-br from-background to-rose-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real feedback from customers and businesses using OpenSlot
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-muted/25 transition-all duration-300"
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-sage-400 mb-4" />
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sage-200 to-sage-400 rounded-full flex items-center justify-center">
                  <span className="text-sage-800 font-semibold text-sm">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};