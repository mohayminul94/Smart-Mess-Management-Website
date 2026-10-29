'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  ReceiptText,
  Wallet,
  Calculator,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMess } from '@/context/MessContext';
import { cn } from '@/lib/utils';

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { mess, openMealModal, openExpenseModal, openPaymentModal } = useMess();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Members', href: '/members', icon: Users },
    { label: 'Daily Meals', href: '/meals', icon: UtensilsCrossed },
    { label: 'Bazar & Expenses', href: '/expenses', icon: ReceiptText },
    { label: 'Member Deposits', href: '/payments', icon: Wallet },
    { label: 'Settlement & Calcs', href: '/calculations', icon: Calculator },
    { label: 'Reports', href: '/reports', icon: FileBarChart },
    { label: 'Mess Settings', href: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <a href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="text-sm font-bold text-slate-900 tracking-tight block">
                Smart Mess
              </span>
              <span className="text-2xs font-medium text-emerald-600 uppercase tracking-wider block">
                Manager Portal
              </span>
            </div>
          )}
        </a>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mess Name Badge */}
      {!isCollapsed && mess && (
        <div className="px-4 py-2.5 mx-3 mt-3 bg-emerald-50/60 rounded-lg border border-emerald-100/80">
          <p className="text-2xs uppercase tracking-wider font-semibold text-emerald-800">
            Current Mess
          </p>
          <p className="text-xs font-medium text-slate-800 truncate mt-0.5">{mess.name}</p>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen?.(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors group',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Quick Actions in Sidebar */}
      {!isCollapsed && (
        <div className="px-3 py-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-200/60">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center gap-1">
            <PlusCircle className="w-3 h-3" /> Quick Record
          </p>
          <div className="grid grid-cols-3 gap-1 text-center">
            <button
              onClick={() => {
                openMealModal();
                setIsMobileOpen?.(false);
              }}
              className="px-2 py-1.5 text-2xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              Meal
            </button>
            <button
              onClick={() => {
                openExpenseModal();
                setIsMobileOpen?.(false);
              }}
              className="px-2 py-1.5 text-2xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              Expense
            </button>
            <button
              onClick={() => {
                openPaymentModal();
                setIsMobileOpen?.(false);
              }}
              className="px-2 py-1.5 text-2xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              Deposit
            </button>
          </div>
        </div>
      )}

      {/* Manager Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-2xs text-slate-500 truncate flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" /> Manager
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="fixed inset-y-0 z-30 flex flex-col h-full bg-white">
          <div className={cn('h-full', isCollapsed ? 'w-20' : 'w-64')}>{sidebarContent}</div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
