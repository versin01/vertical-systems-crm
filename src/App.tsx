import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Suspense } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './pages/Dashboard';
import LeadsCRM from './pages/Leads/LeadsCRM';
import LeadDetail from './pages/Leads/LeadDetail';
import LeadMetrics from './pages/Leads/LeadMetrics';
import SalesPipeline from './pages/SalesPipeline';
import SalesCRM from './pages/Sales/SalesCRM';
import SalesMetrics from './pages/Sales/SalesMetrics';
import SetterReports from './pages/Sales/SetterReports';
import CloserReports from './pages/Sales/CloserReports';
import Proposals from './pages/Documents/Proposals';
import CashIn from './pages/Finances/CashIn';
import CashOut from './pages/Finances/CashOut';
import Receivables from './pages/Finances/Receivables';
import FinancialDashboard from './pages/Finances/FinancialDashboard';
import PlaceholderPage from './pages/placeholder/PlaceholderPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white font-space-grotesk">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-16 lg:ml-64 p-6 min-h-[calc(100vh-4rem)]">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Leads Routes */}
                <Route path="/leads/crm" element={<LeadsCRM />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/leads/metrics" element={<LeadMetrics />} />
                
                {/* Sales Routes */}
                <Route path="/sales/pipeline" element={<SalesPipeline />} />
                <Route path="/sales/crm" element={<SalesCRM />} />
                <Route path="/sales/metrics" element={<SalesMetrics />} />
                <Route path="/sales/setter-reports" element={
                  <SetterReports />
                } />
                <Route path="/sales/closer-reports" element={
                  <CloserReports />
                } />
                
                {/* Documents Routes */}
                <Route path="/documents/proposals" element={
                  <Suspense fallback={
                    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
                      </div>
                    </div>
                  }>
                    <Proposals />
                  </Suspense>
                } />
                <Route path="/documents/contracts" element={
                  <PlaceholderPage 
                    title="Contracts" 
                    subtitle="Manage legal contracts and agreements."
                    gradientClass="section-gradient-documents"
                  />
                } />
                <Route path="/documents/invoices" element={
                  <PlaceholderPage 
                    title="Invoices" 
                    subtitle="Generate and track invoices."
                    gradientClass="section-gradient-documents"
                  />
                } />
                
                {/* Finances Routes */}
                <Route path="/finances/dashboard" element={
                  <FinancialDashboard />
                } />
                <Route path="/finances/cash-in" element={
                  <CashIn />
                } />
                <Route path="/finances/cash-out" element={
                  <CashOut />
                } />
                <Route path="/finances/receivables" element={<Receivables />} />
                <Route path="/finances/calendar" element={
                  <PlaceholderPage 
                    title="Financial Calendar" 
                    subtitle="Schedule and track financial events."
                    gradientClass="section-gradient-finances"
                  />
                } />
                
                {/* Operations Routes */}
                <Route path="/onboarding/one-click" element={
                  <PlaceholderPage 
                    title="One Click Onboarding" 
                    subtitle="Streamlined client onboarding process."
                    gradientClass="section-gradient-onboarding"
                  />
                } />
                <Route path="/onboarding/employee" element={
                  <PlaceholderPage 
                    title="Employee Onboarding" 
                    subtitle="Manage new employee onboarding."
                    gradientClass="section-gradient-onboarding"
                  />
                } />
                
                {/* Strategy Routes */}
                <Route path="/fulfillment/service-delivery" element={
                  <PlaceholderPage 
                    title="Service Delivery" 
                    subtitle="Manage service delivery and client satisfaction."
                    gradientClass="section-gradient-fulfillment"
                  />
                } />
                <Route path="/fulfillment/templates" element={
                  <PlaceholderPage 
                    title="Templates" 
                    subtitle="Create and manage service templates."
                    gradientClass="section-gradient-fulfillment"
                  />
                } />
                
                {/* Tools Routes */}
                <Route path="/ai-tools/content-companion" element={
                  <PlaceholderPage 
                    title="AI Content Companion" 
                    subtitle="AI-powered content creation and optimization."
                    gradientClass="section-gradient-ai-tools"
                  />
                } />
                <Route path="/ai-tools/audit-tool" element={
                  <PlaceholderPage 
                    title="Audit Tool" 
                    subtitle="Comprehensive business auditing with AI."
                    gradientClass="section-gradient-ai-tools"
                  />
                } />
                
                {/* Team Routes */}
                <Route path="/team/daily-reports" element={
                  <PlaceholderPage 
                    title="Daily Reports" 
                    subtitle="Track daily team performance and activities."
                    gradientClass="section-gradient-team"
                  />
                } />
                <Route path="/team/consulting-log" element={
                  <PlaceholderPage 
                    title="Consulting Log" 
                    subtitle="Log and track consulting activities."
                    gradientClass="section-gradient-team"
                  />
                } />
                <Route path="/team/sops" element={
                  <PlaceholderPage 
                    title="SOPs" 
                    subtitle="Standard Operating Procedures management."
                    gradientClass="section-gradient-team"
                  />
                } />
                
                {/* Offer Routes */}
                <Route path="/offer/creation-tool" element={
                  <PlaceholderPage 
                    title="Offer Creation Tool" 
                    subtitle="Create compelling service offers."
                    gradientClass="section-gradient-offer"
                  />
                } />
                <Route path="/offer/revenue-calculator" element={
                  <PlaceholderPage 
                    title="Revenue Calculator" 
                    subtitle="Calculate potential revenue from offers."
                    gradientClass="section-gradient-offer"
                  />
                } />
                <Route path="/offer/ideas" element={
                  <PlaceholderPage 
                    title="Ideas" 
                    subtitle="Brainstorm and develop new offer ideas."
                    gradientClass="section-gradient-offer"
                  />
                } />

                {/* Payment Routes */}
                <Route path="/payment/processing" element={
                  <PlaceholderPage 
                    title="Payment Processing" 
                    subtitle="Process and manage payments."
                    gradientClass="section-gradient-finances"
                  />
                } />
                <Route path="/payment/history" element={
                  <PlaceholderPage 
                    title="Payment History" 
                    subtitle="View payment transaction history."
                    gradientClass="section-gradient-finances"
                  />
                } />
              </Routes>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;