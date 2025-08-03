import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useIsMobile } from '@/hooks/use-mobile';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import MobileOptimizedDashboard from '@/components/dashboard/MobileOptimizedDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import { Button } from '@/components/ui/button';
import { Settings, User, ChevronDown, Eye, Edit, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';


const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { user: routeUser, profile: routeProfile, loading: routeLoading } = useRouteProtection();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Additional safety check for profile
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Route protection handles redirects, so if we're here, user is authenticated and profile is complete
  
  // For mobile devices, use the mobile-optimized dashboard without the desktop wrapper
  if (isMobile && profile.active_role === 'customer') {
    return <MobileOptimizedDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 overflow-x-hidden w-full">

      {/* Banner Section with Logo */}
      <div className="relative bg-gradient-to-r from-card via-card/95 to-accent/10 border-b border-border/50 w-full overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            {/* Logo Section - Left */}
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
              <span className="font-bold text-2xl sm:text-3xl text-foreground">
                OpenSlot
              </span>
            </div>

            {/* Account Management Options - Right */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Settings className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Profile</span>
                    <ChevronDown className="h-4 w-4 sm:ml-2 ml-1" />
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border/50 backdrop-blur-sm overflow-hidden">
          {profile.active_role === 'customer' ? (
            <CustomerDashboard />
          ) : (
            <ProviderDashboard />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;