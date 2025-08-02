import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  name: string;
  email: string;
  user_type: 'customer' | 'business' | 'both';
  rating: number;
  title: string;
  review: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
      } else {
        // Cast the data to our Review type to handle the user_type field
        const typedData = (data || []).map(review => ({
          ...review,
          user_type: review.user_type as 'customer' | 'business' | 'both'
        }));
        setReviews(typedData);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (reviewData: Omit<Review, 'id' | 'created_at' | 'is_approved' | 'is_featured'>) => {
    try {
      const { data, error } = await supabase
        .from('platform_reviews')
        .insert([{
          name: reviewData.name,
          email: reviewData.email,
          user_type: reviewData.user_type,
          rating: reviewData.rating,
          title: reviewData.title,
          review: reviewData.review,
          is_approved: false, // Reviews need approval by default
          is_featured: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding review:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  };

  const getDisplayedReviews = () => {
    // Return up to 6 most recent approved reviews with rating 4 or 5
    return reviews
      .filter(review => review.rating >= 4 && review.is_approved)
      .slice(0, 6);
  };

  return {
    reviews,
    addReview,
    getDisplayedReviews,
    loading,
  };
};