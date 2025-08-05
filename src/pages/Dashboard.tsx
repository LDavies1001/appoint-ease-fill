import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useIsMobile } from '@/hooks/use-mobile';
import ResponsiveCustomerDashboard from '@/components/dashboard/ResponsiveCustomerDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import SimplifiedMobileBusinessDashboard from '@/components/dashboard/SimplifiedMobileBusinessDashboard';
import { Button } from '@/components/ui/button';
import { Settings, User, ChevronDown, Eye, Edit, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Use route protection to handle auth and profile checks
  useRouteProtection();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 w-full">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - Compact for mobile */}
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
              alt="OpenSlot Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg text-foreground">
              OpenSlot
            </span>
          </div>

          {/* User Menu - Mobile optimized */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border z-50" align="end">
              <DropdownMenuItem asChild>
                <Link to={`/business/${profile?.user_id || user?.id}`} className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="flex items-center text-destructive hover:text-destructive/90"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - Mobile first with minimal padding */}
      <div className="px-3 py-4 pb-20">
        {profile.active_role === 'customer' ? (
          <ResponsiveCustomerDashboard />
        ) : isMobile ? (
          <SimplifiedMobileBusinessDashboard />
        ) : (
          <ProviderDashboard />
        )}
      </div>
    </div>
  );
};

export default Dashboard;