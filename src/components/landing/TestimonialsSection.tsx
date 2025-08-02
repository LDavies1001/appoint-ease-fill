import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, X } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';

export const TestimonialsSection = () => {
  const { getDisplayedReviews, removeReview } = useReviews();
  const displayedReviews = getDisplayedReviews();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'customer': return 'Customer';
      case 'business': return 'Business Owner';
      case 'both': return 'Customer & Business Owner';
      default: return 'User';
    }
  };

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

        {displayedReviews.length === 0 ? (
          <div className="text-center">
            <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-muted/50 to-muted/80 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">No reviews yet!</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Be one of the first to experience OpenSlot and help us build something amazing together. 
                Your feedback will help shape the future of appointment booking.
              </p>
              
              <Link to="/review">
                <Button 
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Leave a Review
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  {/* Delete button - only visible in dev mode or for testing */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => removeReview(review.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  
                  <div className="flex items-center mb-3">
                    <div className="flex space-x-1 mr-3">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getUserTypeLabel(review.userType)}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-foreground mb-2">
                    {review.title}
                  </h4>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    "{review.review}"
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">
                      {review.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/review">
                <Button 
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Your Review
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};