import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/custom-button';
import { Calendar } from 'lucide-react';

const Header = () => {
  return (
    <nav className="bg-white border-b border-border/40 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">FillMyHole</span>
          </Link>
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
        </div>
      </div>
    </nav>
  );
};

export default Header;