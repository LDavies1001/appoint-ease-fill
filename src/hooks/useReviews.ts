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
        const parsedReviews = JSON.parse(savedReviews);
        // Filter out test reviews with title "great" or other test data
        const filteredReviews = parsedReviews.filter((review: Review) => 
          review.title.toLowerCase() !== 'great' && 
          review.review.toLowerCase() !== 'great'
        );
        setReviews(filteredReviews);
        // Update localStorage with filtered reviews
        if (filteredReviews.length !== parsedReviews.length) {
          localStorage.setItem('openslot-reviews', JSON.stringify(filteredReviews));
        }
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

  return {
    reviews,
    addReview,
    getDisplayedReviews,
  };
};