import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
          <Link to={user ? "/dashboard" : "/"} className="text-primary hover:text-primary/80 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
