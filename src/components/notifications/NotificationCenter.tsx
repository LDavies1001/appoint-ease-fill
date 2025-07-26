import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/custom-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationCenter = () => {
  const { notifications, loading, loadNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
      case 'booking_confirmed':
      case 'new_booking_received':
        return <Calendar className="h-4 w-4" />;
      case 'profile_updated':
      case 'profile_update_notifications':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatNotificationType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see your notification history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">
                        {formatNotificationType(notification.notification_type)}
                      </h4>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {getChannelIcon(notification.channel)}
                        <span className="text-xs capitalize">{notification.channel}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(notification.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()} at{' '}
                        {new Date(notification.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {notification.sent_at && (
                      <p className="text-xs text-muted-foreground">
                        Sent: {new Date(notification.sent_at).toLocaleString()}
                      </p>
                    )}
                    
                    {notification.booking_id && (
                      <p className="text-xs text-muted-foreground">
                        Booking ID: {notification.booking_id.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
                
                {index < notifications.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;