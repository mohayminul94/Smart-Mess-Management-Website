'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import QuickMealModal from '../modals/QuickMealModal';
import AddExpenseModal from '../modals/AddExpenseModal';
import AddPaymentModal from '../modals/AddPaymentModal';
import AddMemberModal from '../modals/AddMemberModal';

export default function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Global Quick Action Modals */}
      <QuickMealModal />
      <AddExpenseModal />
      <AddPaymentModal />
      <AddMemberModal />
    </div>
  );
}
