import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface RetentionNotificationsProps {
  onDismiss: () => void;
  onCreateSlot: () => void;
}

const RetentionNotifications: React.FC<RetentionNotificationsProps> = ({ 
  onDismiss, 
  onCreateSlot 
}) => {
  const [currentNotification, setCurrentNotification] = useState(0);

  const notifications = [
    {
      type: 'no-slots-today',
      icon: <Calendar className="h-5 w-5 text-amber-500" />,
      title: "You haven't posted a slot today",
      description: "Keep your calendar full! Post a slot to attract bookings.",
      action: "Post Now",
      actionFn: onCreateSlot,
      priority: 'high'
    },
    {
      type: 'weekly-reminder',
      icon: <TrendingUp className="h-5 w-5 text-business-primary" />,
      title: "Weekly performance tip",
      description: "Slots posted in the morning get 40% more bookings.",
      action: "Good to know",
      actionFn: onDismiss,
      priority: 'medium'
    },
    {
      type: 'engagement',
      icon: <Users className="h-5 w-5 text-accent" />,
      title: "Stay active",
      description: "Regular posting keeps you visible to customers.",
      action: "Create Slot",
      actionFn: onCreateSlot,
      priority: 'medium'
    }
  ];

  const currentNotif = notifications[currentNotification];

  return (
    <Card className="relative bg-gradient-to-r from-amber-50 to-business-muted/30 border-amber-200/50 p-4 shadow-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="absolute top-2 right-2 h-6 w-6 p-0"
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {currentNotif.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground mb-1">
            {currentNotif.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {currentNotif.description}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={currentNotif.actionFn}
              className="h-8 px-3 text-xs btn-business"
            >
              {currentNotif.action}
            </Button>
            
            {notifications.length > 1 && currentNotification < notifications.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentNotification(prev => prev + 1)}
                className="h-8 px-3 text-xs"
              >
                Next tip
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress dots for multiple notifications */}
      {notifications.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {notifications.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentNotification ? 'bg-business-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default RetentionNotifications;