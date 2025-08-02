import React from 'react';
import { Instagram, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">OpenSlot.uk</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Helping small businesses fill last-minute appointments
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Company registration no: 12345678</p>
              <p>Based in the UK</p>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Navigation</h3>
            <nav className="flex flex-col space-y-3">
              <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </a>
              <a href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="/faqs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQs
              </a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </a>
              <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </a>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Legal</h3>
            <nav className="flex flex-col space-y-3">
              <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </a>
            </nav>
          </div>

          {/* Column 4: Contact & Social */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Get in Touch</h3>
            <div className="space-y-3">
              <a 
                href="mailto:hello@openslot.uk" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
              >
                hello@openslot.uk
              </a>
              
              <div className="flex space-x-4 pt-2">
                <a
                  href="https://instagram.com/openslot.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://tiktok.com/@openslot.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Follow us on TikTok"
                >
                  <Music size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Base Line */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-center text-sm text-muted-foreground">
            Made with 💚 in the UK to support independent businesses.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;