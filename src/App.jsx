import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import TxModal from './components/common/TxModal';
import Toast from './components/common/Toast';

// Public Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Marketplace from './pages/Marketplace';
import Auctions from './pages/Auctions';
import NFTDetails from './pages/NFTDetails';
import Loyalty from './pages/Loyalty';
import About from './pages/About';
import OrderDetails from './pages/OrderDetails';
import DealershipApply from './pages/DealershipApply';

// Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard';
import DealerDashboard from './pages/dashboard/DealerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      {/* Mobile Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/nft/:id" element={<NFTDetails />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/about" element={<About />} />
          <Route path="/order" element={<OrderDetails />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/apply-dealership" element={<DealershipApply />} />
          <Route path="/dealership" element={<Navigate to="/apply-dealership" replace />} />

          {/* Dashboards */}
          <Route path="/dashboard" element={<Navigate to="/dashboard/user" replace />} />
          <Route path="/dashboard/user" element={<UserDashboard />} />
          <Route path="/dashboard/dealer" element={<DealerDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Modals & Notifications */}
      <TxModal />
      <Toast />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
