'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentMonth } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

const MessContext = createContext(null);

export function MessProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [currentMonth, setCurrentMonth] = useState('2026-10');
  const [mess, setMess] = useState(null);
  const [loadingMess, setLoadingMess] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize client current month inside useEffect to avoid prerender new Date() discrepancy
  useEffect(() => {
    setCurrentMonth(getCurrentMonth());
  }, []);

  // Quick action modal states
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const fetchMess = useCallback(async () => {
    if (!isAuthenticated) {
      setLoadingMess(false);
      return;
    }
    try {
      setLoadingMess(true);
      const res = await api.get('/mess/settings');
      if (res?.success) {
        setMess(res.mess);
      }
    } catch (err) {
      console.error('Failed to fetch mess settings', err);
    } finally {
      setLoadingMess(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMess();
  }, [fetchMess]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const currencySymbol = mess?.currencySymbol || '৳';

  return (
    <MessContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        mess,
        currencySymbol,
        loadingMess,
        refreshMess: fetchMess,
        refreshTrigger,
        triggerRefresh,
        // Modal states
        isMealModalOpen,
        openMealModal: () => setIsMealModalOpen(true),
        closeMealModal: () => setIsMealModalOpen(false),
        isExpenseModalOpen,
        openExpenseModal: () => setIsExpenseModalOpen(true),
        closeExpenseModal: () => setIsExpenseModalOpen(false),
        isPaymentModalOpen,
        openPaymentModal: () => setIsPaymentModalOpen(true),
        closePaymentModal: () => setIsPaymentModalOpen(false),
        isMemberModalOpen,
        openMemberModal: () => setIsMemberModalOpen(true),
        closeMemberModal: () => setIsMemberModalOpen(false),
      }}
    >
      {children}
    </MessContext.Provider>
  );
}

export function useMess() {
  const context = useContext(MessContext);
  if (!context) {
    throw new Error('useMess must be used within a MessProvider');
  }
  return context;
}
