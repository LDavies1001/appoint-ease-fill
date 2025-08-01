import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import BookingNotificationHelper from "@/components/notifications/BookingNotificationHelper";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerSignup from "./pages/CustomerSignup";
import BusinessSignup from "./pages/BusinessSignup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SlotDiscovery from "./pages/SlotDiscovery";
import BusinessProfile from "./pages/BusinessProfile";
import NewBusinessProfile from "./pages/NewBusinessProfile";
import CreateBusinessProfile from "./pages/CreateBusinessProfile";
import Profile from "./pages/Profile";
import PublicPortfolio from "./pages/PublicPortfolio";
import EnhancedBusinessProfile from "./pages/EnhancedBusinessProfile";
import ProviderBooking from "./pages/ProviderBooking";
import UserSettings from "./pages/UserSettings";
import CustomerProfileView from "./pages/CustomerProfileView";
import CustomerBusinessView from "./pages/CustomerBusinessView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BookingNotificationHelper>
          <BrowserRouter>
            <div className="min-h-screen bg-background overflow-x-hidden w-full">
              
              <main className="overflow-x-hidden w-full">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signup/customer" element={<CustomerSignup />} />
                  <Route path="/signup/business" element={<BusinessSignup />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/discover" element={<SlotDiscovery />} />
                  <Route path="/business-profile" element={<NewBusinessProfile />} />
                  <Route path="/create-business-profile" element={<CreateBusinessProfile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/portfolio/:providerId" element={<PublicPortfolio />} />
                  <Route path="/business/:providerId" element={<EnhancedBusinessProfile />} />
                  <Route path="/provider/:providerId/book" element={<ProviderBooking />} />
                  <Route path="/customer/:customerId" element={<CustomerProfileView />} />
                  <Route path="/business/:providerId/view" element={<CustomerBusinessView />} />
                  <Route path="/settings" element={<UserSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </BookingNotificationHelper>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
