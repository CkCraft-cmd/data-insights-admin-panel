
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import BusinessPage from "@/pages/BusinessPage";
import ProductPage from "@/pages/ProductPage";
import CustomerPage from "@/pages/CustomerPage";
import OfferPage from "@/pages/OfferPage";
import TransactionPage from "@/pages/TransactionPage";
import LoyaltyPage from "@/pages/LoyaltyPage";
import TierSystemPage from "@/pages/TierSystemPage";
import ReferralPage from "@/pages/ReferralPage";
import FeedbackPage from "@/pages/FeedbackPage";
import PromotionPage from "@/pages/PromotionPage";
import FraudDetectionPage from "@/pages/FraudDetectionPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            
            <Route path="/businesses" element={
              <AuthGuard>
                <BusinessPage />
              </AuthGuard>
            } />
            
            <Route path="/products" element={
              <AuthGuard>
                <ProductPage />
              </AuthGuard>
            } />
            
            <Route path="/customers" element={
              <AuthGuard>
                <CustomerPage />
              </AuthGuard>
            } />
            
            <Route path="/offers" element={
              <AuthGuard>
                <OfferPage />
              </AuthGuard>
            } />
            
            <Route path="/transactions" element={
              <AuthGuard>
                <TransactionPage />
              </AuthGuard>
            } />
            
            <Route path="/loyalty" element={
              <AuthGuard>
                <LoyaltyPage />
              </AuthGuard>
            } />
            
            <Route path="/tier-system" element={
              <AuthGuard>
                <TierSystemPage />
              </AuthGuard>
            } />
            
            <Route path="/referrals" element={
              <AuthGuard>
                <ReferralPage />
              </AuthGuard>
            } />
            
            <Route path="/feedback" element={
              <AuthGuard>
                <FeedbackPage />
              </AuthGuard>
            } />
            
            <Route path="/promotions" element={
              <AuthGuard>
                <PromotionPage />
              </AuthGuard>
            } />
            
            <Route path="/fraud" element={
              <AuthGuard>
                <FraudDetectionPage />
              </AuthGuard>
            } />
            
            <Route path="/analytics" element={
              <AuthGuard>
                <AnalyticsPage />
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
