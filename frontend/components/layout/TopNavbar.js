'use client';

import React from 'react';
import { Menu, Calendar, Plus, Utensils, Receipt, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMess } from '@/context/MessContext';
import { useAuth } from '@/context/AuthContext';
import { getMonthName } from '@/lib/utils';
import Button from '../ui/Button';

export default function TopNavbar({ onOpenMobileMenu }) {
  const {
    currentMonth,
    setCurrentMonth,
    mess,
    openMealModal,
    openExpenseModal,
    openPaymentModal,
  } = useMess();
  const { user } = useAuth();

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${y}-${m}`);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Mobile menu toggle + Mess Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-semibold text-slate-900 text-sm">
              {mess?.name || 'Smart Mess'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {mess?.currency || 'BDT'} ({mess?.currencySymbol || '৳'})
            </span>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 border-none p-0 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Utensils}
              onClick={openMealModal}
              className="text-xs"
            >
              Meal
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Receipt}
              onClick={openExpenseModal}
              className="text-xs"
            >
              Expense
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Wallet}
              onClick={openPaymentModal}
              className="text-xs"
            >
              Deposit
            </Button>
          </div>

          {/* Quick Plus button on mobile */}
          <div className="md:hidden">
            <Button variant="primary" size="sm" onClick={openExpenseModal} icon={Plus}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
