import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Calendar, ChevronDown, User, Settings, LogOut, Building, Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSwitcher } from '@/components/ui/role-switcher';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Mobile Navigation Component
  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="flex flex-col space-y-4 mt-6">
          {user && profile ? (
            <>
              <div className="flex items-center space-x-3 pb-4 border-b">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.active_role === 'provider' 
                      ? (profile.business_name || profile.name || profile.email)
                      : (profile.name || profile.email)
                    }
                  </p>
                  <div className="mt-2">
                    <RoleSwitcher />
                  </div>
                </div>
              </div>
              
              <SheetClose asChild>
                <Link to="/dashboard" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Calendar className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>
              
              {profile.active_role === 'customer' && (
                <SheetClose asChild>
                  <Link to="/discover" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                    <Search className="h-5 w-5" />
                    <span>Find Slots</span>
                  </Link>
                </SheetClose>
              )}
              
              <SheetClose asChild>
                <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  {profile.active_role === 'provider' ? (
                    <>
                      <Building className="h-5 w-5" />
                      <span>Business Profile</span>
                    </>
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </>
                  )}
                </Link>
              </SheetClose>
              
              <SheetClose asChild>
                <Link to="/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Settings className="h-5 w-5" />
                  <span>Account Settings</span>
                </Link>
              </SheetClose>
              
              <Button
                variant="ghost"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-3 p-3 w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link to="/discover" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Search className="h-5 w-5" />
                  <span>Find Slots</span>
                </Link>
              </SheetClose>
              
              <SheetClose asChild>
                <Link to="/auth?tab=provider" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Building className="h-5 w-5" />
                  <span>For Your Business</span>
                </Link>
              </SheetClose>
              
              <div className="pt-4 space-y-3">
                <SheetClose asChild>
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full">
                      Log In
                    </Button>
                  </Link>
                </SheetClose>
                
                <SheetClose asChild>
                  <Link to="/auth?tab=signup" className="block">
                    <Button variant="default" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="bg-white border-b border-border/40 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img 
              src="/lovable-uploads/3fe42c9c-7458-4205-a88e-61bea2713e02.png" 
              alt="OpenSlot Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg"
            />
            <span className="text-lg sm:text-xl font-bold text-foreground">OpenSlot</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            {user && profile ? (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <RoleSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium max-w-32 truncate">
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
                      <Link to="/dashboard" className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {profile.active_role === 'customer' && (
                      <DropdownMenuItem asChild>
                        <Link to="/discover" className="flex items-center">
                          <Search className="h-4 w-4 mr-2" />
                          Find Slots
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        {profile.active_role === 'provider' ? (
                          <>
                            <Building className="h-4 w-4 mr-2" />
                            Business Profile
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 mr-2" />
                            My Profile
                          </>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link to="/discover">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 text-sm transition-colors">
                    Find Slots
                  </Button>
                </Link>
                <Link to="/auth?tab=provider">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 text-sm transition-colors">
                    For Your Business
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="text-sm border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300">
                    Log In
                  </Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button size="sm" className="text-sm bg-gradient-to-r from-rose-200 to-rose-300 hover:from-rose-300 hover:to-rose-400 text-rose-800 shadow-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </nav>
  );
};

export default Header;