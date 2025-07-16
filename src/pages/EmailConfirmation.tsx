import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Header from '@/components/ui/header';

const EmailConfirmation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground">
              We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Don't forget to check your spam folder
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Didn't receive an email? Check your spam folder or try signing up again.
            </div>
          </div>
          
          <div className="pt-4">
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirmation;