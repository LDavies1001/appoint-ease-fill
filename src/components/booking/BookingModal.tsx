import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  ExternalLink,
  Star,
  CreditCard
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    price: number;
    discount_price?: number;
    duration: number;
    notes?: string;
    provider_id: string;
    provider?: {
      name?: string;
      location?: string;
      business_name?: string;
      business_phone?: string;
      business_email?: string;
      rating?: number;
    };
    provider_service?: {
      service_name: string;
      description?: string;
    };
    service?: {
      name: string;
    };
  };
  onBookingSuccess?: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  slot,
  onBookingSuccess
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [contactName, setContactName] = useState(profile?.name || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '');
  const [contactEmail, setContactEmail] = useState(profile?.email || '');

  const businessName = slot.provider?.business_name || slot.provider?.name || 'Business';
  const serviceName = slot.provider_service?.service_name || slot.service?.name || 'Service';
  const finalPrice = slot.discount_price || slot.price;
  const savings = slot.discount_price ? slot.price - slot.discount_price : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleBookSlot = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book appointments",
        variant: "destructive"
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      toast({
        title: "Contact details required",
        description: "Please provide your name and phone number",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);

    try {
      // Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          provider_id: slot.provider_id,
          slot_id: slot.id,
          service_id: null, // Made nullable in database since we reference through provider_services
          booking_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: finalPrice,
          customer_notes: customerNotes.trim() || null,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slot.id);

      if (slotError) throw slotError;

      // Update profile with contact details if changed
      if (contactName !== profile?.name || contactPhone !== profile?.phone) {
        await supabase
          .from('profiles')
          .update({
            name: contactName.trim(),
            phone: contactPhone.trim(),
            email: contactEmail.trim()
          })
          .eq('user_id', user.id);
      }

      setIsSuccess(true);
      onBookingSuccess?.();
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
    }
    setCustomerNotes('');
    setAcceptTerms(false);
    onClose();
  };

  const generateCalendarUrl = () => {
    const startDate = new Date(`${slot.date}T${slot.start_time}`);
    const endDate = new Date(`${slot.date}T${slot.end_time}`);
    
    const title = encodeURIComponent(`${serviceName} with ${businessName}`);
    const details = encodeURIComponent(`Appointment with ${businessName}\nService: ${serviceName}\nPrice: £${finalPrice}`);
    
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateTime(startDate)}/${formatDateTime(endDate)}&details=${details}`;
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your appointment has been successfully booked
              </p>
            </div>

            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{formatDate(slot.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>{businessName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => window.open(generateCalendarUrl(), '_blank')}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
              <Button onClick={handleClose} className="w-full btn-primary">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirm Your Booking</DialogTitle>
          <DialogDescription>
            Review the details below and provide your information to complete the booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{businessName}</h3>
                  <Badge variant="secondary">{serviceName}</Badge>
                  {slot.provider?.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{slot.provider.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {savings > 0 ? (
                    <div>
                      <div className="line-through text-muted-foreground text-sm">£{slot.price}</div>
                      <div className="text-xl font-bold text-primary">£{finalPrice}</div>
                      <div className="text-xs text-green-600 font-medium">Save £{savings}!</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold">£{finalPrice}</div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">{formatDate(slot.date)}</div>
                    <div className="text-muted-foreground">{slot.duration} minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
                    <div className="text-muted-foreground">Duration</div>
                  </div>
                </div>
                {slot.provider?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{slot.provider.location}</div>
                      <div className="text-muted-foreground">Location</div>
                    </div>
                  </div>
                )}
                {slot.provider?.business_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{slot.provider.business_phone}</div>
                      <div className="text-muted-foreground">Contact</div>
                    </div>
                  </div>
                )}
              </div>

              {slot.provider_service?.description && (
                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-1">Service Description:</h4>
                  <p className="text-sm text-muted-foreground">{slot.provider_service.description}</p>
                </div>
              )}

              {slot.notes && (
                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-1">Special Notes:</h4>
                  <p className="text-sm text-muted-foreground">{slot.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number *</label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any special requests or notes for the provider..."
              rows={3}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            />
            <label htmlFor="terms" className="text-sm leading-5">
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline">terms and conditions</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">cancellation policy</a>.
              I understand that this booking is subject to provider confirmation.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleBookSlot} 
              disabled={isBooking || !acceptTerms}
              className="flex-1 btn-primary"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;