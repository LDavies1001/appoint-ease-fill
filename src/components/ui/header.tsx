import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Calendar, ChevronDown, User, Settings, LogOut, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSwitcher } from '@/components/ui/role-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-border/40 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Open-Slot</span>
          </Link>
          
          {user && profile ? (
            <div className="flex items-center space-x-4">
              <RoleSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {profile.active_role === 'provider' 
                        ? (profile.business_name || profile.name || profile.email)
                        : (profile.name || profile.email)
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      {profile.active_role === 'provider' ? (
                        <>
                          <Building className="h-4 w-4 mr-2" />
                          My Profile & Business
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {profile.active_role === 'provider' && (
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        MyAdmin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/auth?tab=provider">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  For Your Business
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;