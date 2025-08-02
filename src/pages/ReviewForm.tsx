import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReviews } from '@/hooks/useReviews';

export default function ReviewForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addReview } = useReviews();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '',
    rating: '',
    title: '',
    review: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save the review
    addReview({
      name: formData.name,
      email: formData.email,
      userType: formData.userType as 'customer' | 'business' | 'both',
      rating: parseInt(formData.rating),
      title: formData.title,
      review: formData.review
    });
    
    toast({
      title: "Review submitted!",
      description: "Thank you for your feedback. Your review is now live!",
    });
    
    // Navigate back to home page
    navigate('/', { replace: true });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-rose-50/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="font-bold text-xl text-foreground">
                OpenSlot
              </span>
            </Link>
            
            <Link to="/">
              <Button variant="ghost" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Share Your Experience
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us improve OpenSlot by sharing your feedback and experience
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              Leave a Review
            </CardTitle>
            <CardDescription>
              Your feedback helps us create a better experience for everyone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {/* User Type */}
              <div className="space-y-3">
                <Label>I use OpenSlot as a:</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => handleChange('userType', value)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer">Customer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business">Business Owner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <Label>Overall Rating</Label>
                <RadioGroup
                  value={formData.rating}
                  onValueChange={(value) => handleChange('rating', value)}
                  className="flex space-x-4"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="flex items-center space-x-1">
                      <RadioGroupItem value={star.toString()} id={`star-${star}`} />
                      <Label htmlFor={`star-${star}`} className="flex items-center cursor-pointer">
                        {star} <Star className="h-4 w-4 ml-1 text-amber-500" />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Review Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Summarize your experience"
                  required
                />
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  value={formData.review}
                  onChange={(e) => handleChange('review', e.target.value)}
                  placeholder="Tell us about your experience with OpenSlot..."
                  rows={5}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3"
                disabled={!formData.name || !formData.email || !formData.userType || !formData.rating || !formData.title || !formData.review}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Reviews are manually reviewed before being published
          </p>
        </div>
      </main>
    </div>
  );
}