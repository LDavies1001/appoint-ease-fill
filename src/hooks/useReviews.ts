import { useState, useEffect } from 'react';

export interface Review {
  id: string;
  name: string;
  email: string;
  userType: 'customer' | 'business' | 'both';
  rating: number;
  title: string;
  review: string;
  createdAt: string;
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Load reviews from localStorage on component mount
    const savedReviews = localStorage.getItem('openslot-reviews');
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (error) {
        console.error('Error parsing saved reviews:', error);
      }
    }
  }, []);

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('openslot-reviews', JSON.stringify(updatedReviews));
    
    return newReview;
  };

  const getDisplayedReviews = () => {
    // Return up to 6 most recent reviews with rating 4 or 5
    return reviews
      .filter(review => review.rating >= 4)
      .slice(0, 6);
  };

  const removeReview = (reviewId: string) => {
    const updatedReviews = reviews.filter(review => review.id !== reviewId);
    setReviews(updatedReviews);
    localStorage.setItem('openslot-reviews', JSON.stringify(updatedReviews));
  };

  const clearAllReviews = () => {
    setReviews([]);
    localStorage.removeItem('openslot-reviews');
  };

  return {
    reviews,
    addReview,
    getDisplayedReviews,
    removeReview,
    clearAllReviews,
  };
};