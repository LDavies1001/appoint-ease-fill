import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Camera, 
  Plus, 
  Play, 
  Star, 
  Heart, 
  Calendar,
  Award,
  ImageIcon,
  Video,
  ThumbsUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BeautyJourneyPhoto {
  id: string;
  photo_type: 'before' | 'after' | 'inspiration';
  image_url: string;
  description: string;
  treatment_type: string;
  created_at: string;
}

interface InspirationBoard {
  id: string;
  title: string;
  description: string;
  is_public: boolean;
  items: InspirationBoardItem[];
}

interface InspirationBoardItem {
  id: string;
  image_url: string;
  title: string;
  description: string;
}

interface CustomerBadge {
  id: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    badge_type: string;
  };
  earned_at: string;
}

interface CustomerReview {
  id: string;
  rating: number;
  comment: string;
  photos: string[];
  video_url: string;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  booking: {
    service: {
      name: string;
    };
  };
}

interface CustomerPortfolioProps {
  customerId: string;
  isOwner: boolean;
}

export const CustomerPortfolio: React.FC<CustomerPortfolioProps> = ({ customerId, isOwner }) => {
  const [journeyPhotos, setJourneyPhotos] = useState<BeautyJourneyPhoto[]>([]);
  const [inspirationBoards, setInspirationBoards] = useState<InspirationBoard[]>([]);
  const [badges, setBadges] = useState<CustomerBadge[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, [customerId]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);

      // Fetch beauty journey photos
      const { data: photosData } = await supabase
        .from('beauty_journey_photos')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(12);

      // Fetch inspiration boards
      const { data: boardsData } = await supabase
        .from('inspiration_boards')
        .select(`
          *,
          inspiration_board_items(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(6);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from('customer_badges')
        .select(`
          *,
          beauty_badges!inner(name, description, icon, badge_type)
        `)
        .eq('customer_id', customerId)
        .order('earned_at', { ascending: false });

      // Fetch reviews with photos/videos
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          bookings!inner(
            services!inner(name)
          )
        `)
        .eq('reviewer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(6);

      setJourneyPhotos((photosData as BeautyJourneyPhoto[]) || []);
      setInspirationBoards(boardsData?.map(board => ({
        ...board,
        items: board.inspiration_board_items || []
      })) || []);
      setBadges(badgesData?.map(item => ({
        id: item.id,
        badge: item.beauty_badges,
        earned_at: item.earned_at
      })) || []);
      setReviews(reviewsData?.map(review => ({
        ...review,
        booking: {
          service: review.bookings?.services || { name: 'Unknown Service' }
        }
      })) || []);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'milestone': return 'from-yellow-500 to-orange-500';
      case 'loyalty': return 'from-purple-500 to-pink-500';
      case 'review': return 'from-green-500 to-emerald-500';
      case 'service': return 'from-blue-500 to-cyan-500';
      case 'special': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Beauty Journey Gallery */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Beauty Journey</h3>
              <p className="text-muted-foreground">My transformation stories</p>
            </div>
          </div>
          {isOwner && (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Photos
            </Button>
          )}
        </div>

        {journeyPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {journeyPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <img
                    src={photo.image_url}
                    alt={photo.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm"
                  >
                    {photo.photo_type}
                  </Badge>
                </div>
                {photo.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{photo.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-3xl">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No photos yet</h4>
            <p className="text-muted-foreground">Start documenting your beauty journey</p>
          </div>
        )}
      </div>

      {/* Inspiration Boards */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Inspiration Boards</h3>
              <p className="text-muted-foreground">Saved looks and ideas</p>
            </div>
          </div>
          {isOwner && (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          )}
        </div>

        {inspirationBoards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspirationBoards.map((board) => (
              <Card key={board.id} className="group hover-scale cursor-pointer overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative">
                  {board.items?.length > 0 ? (
                    <div className="grid grid-cols-2 h-full">
                      {board.items.slice(0, 4).map((item, index) => (
                        <div key={item.id} className="relative overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1">{board.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{board.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {board.items?.length || 0} items
                    </span>
                    {board.is_public && (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-3xl">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No inspiration boards yet</h4>
            <p className="text-muted-foreground">Create mood boards of looks you love</p>
          </div>
        )}
      </div>

      {/* Beauty Badges */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Beauty Achievements</h3>
            <p className="text-muted-foreground">Badges earned along the journey</p>
          </div>
        </div>

        {badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="group text-center hover-scale">
                <div className={`w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${getBadgeColor(badge.badge.badge_type)} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <span className="text-2xl">{badge.badge.icon}</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">{badge.badge.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{badge.badge.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-3xl">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No badges yet</h4>
            <p className="text-muted-foreground">Complete appointments and activities to earn badges</p>
          </div>
        )}
      </div>

      {/* Reviews & Testimonials */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Reviews & Testimonials</h3>
            <p className="text-muted-foreground">Sharing experiences with the community</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_featured && (
                          <Badge variant="default" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {review.booking?.service?.name}
                      </p>
                      <p className="text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>

                  {/* Review Media */}
                  {(review.photos?.length > 0 || review.video_url) && (
                    <div className="mt-4">
                      {review.photos?.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {review.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="w-16 h-16 rounded-lg overflow-hidden">
                              <img src={photo} alt="Review" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {review.photos.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-xs">+{review.photos.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {review.video_url && (
                        <div className="relative w-full h-32 bg-black rounded-lg flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                          <Badge variant="secondary" className="absolute top-2 left-2">
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpful_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-3xl">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No reviews yet</h4>
            <p className="text-muted-foreground">Share your experiences to help others</p>
          </div>
        )}
      </div>
    </div>
  );
};