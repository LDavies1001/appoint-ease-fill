import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Heart, Building } from 'lucide-react';

interface HeroContainerProps {
  children: React.ReactNode;
}

export const HeroContainer = ({ children }: HeroContainerProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 80; // Account for sticky header height
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/10 w-full">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-sage-200 to-sage-400 rounded-lg flex items-center justify-center">
                <span className="text-sage-800 font-bold text-sm">OS</span>
              </div>
              <span className="font-bold text-xl text-foreground group-hover:text-sage-600 transition-colors">
                OpenSlot
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                How it Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Reviews
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Sign In
              </Link>
              <div className="flex space-x-2">
                <Link to="/signup/customer">
                  <Button variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                    <Heart className="h-4 w-4 mr-1" />
                    Customer
                  </Button>
                </Link>
                <Link to="/signup/business">
                  <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white">
                    <Building className="h-4 w-4 mr-1" />
                    Business
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-md text-foreground hover:bg-muted"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border/40 bg-background/95 backdrop-blur-lg">
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  How it Works
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Reviews
                </button>
                
                <hr className="border-border/40" />
                
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Sign In
                </Link>
                
                <div className="flex flex-col space-y-2 pt-2">
                  <Link to="/signup/customer">
                    <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50">
                      <Heart className="h-4 w-4 mr-2" />
                      I'm a Customer
                    </Button>
                  </Link>
                  <Link to="/signup/business">
                    <Button className="w-full bg-sage-600 hover:bg-sage-700 text-white">
                      <Building className="h-4 w-4 mr-2" />
                      I'm a Business
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content container with top padding for sticky header */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};