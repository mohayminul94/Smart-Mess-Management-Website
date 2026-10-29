'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useMess } from '@/context/MessContext';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Wallet,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Filter,
} from 'lucide-react';

export default function PaymentsPage() {
  const { currentMonth, currencySymbol, refreshTrigger, triggerRefresh, openPaymentModal } = useMess();

  const [payments, setPayments] = useState([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [isMonthClosed, setIsMonthClosed] = useState(false);

  // Reversal modal
  const [paymentToReverse, setPaymentToReverse] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversalOpen, setIsReversalOpen] = useState(false);
  const [reversing, setReversing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      let query = `month=${currentMonth}`;
      if (selectedMember) {
        query += `&memberId=${selectedMember}`;
      }

      const [payRes, memRes] = await Promise.all([
        api.get(`/payments?${query}`),
        api.get('/members'),
      ]);

      if (payRes?.success) {
        setPayments(payRes.payments || []);
        setTotalDeposits(payRes.totalDeposits || 0);
        setIsMonthClosed(Boolean(payRes.isMonthClosed));
      }

      if (memRes?.success) {
        setMembers(memRes.members || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, selectedMember]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshTrigger]);

  const handleReversePayment = async (e) => {
    e.preventDefault();
    if (!reversalReason.trim() || reversalReason.trim().length < 5) {
      toast.error('Please provide a reversal reason of at least 5 characters.');
      return;
    }

    try {
      setReversing(true);
      const res = await api.patch(`/payments/${paymentToReverse._id}/reverse`, {
        reversalReason: reversalReason.trim(),
      });

      if (res?.success) {
        toast.success('Payment successfully reversed with full audit trail.');
        triggerRefresh();
        setIsReversalOpen(false);
        setPaymentToReverse(null);
        setReversalReason('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reverse payment');
    } finally {
      setReversing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Member Deposits & Receipts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record cash and MFS deposits, verify settlement balances, and audit payment reversals
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={openPaymentModal}>
            Record New Deposit
          </Button>
        </div>

        {/* Deposit Totals & Financial Info Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-emerald-600 text-white border-emerald-500 shadow-sm sm:col-span-2">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-100">
                  Total Active Member Deposits ({getMonthName(currentMonth)})
                </span>
                <p className="text-2xl font-black mt-1">
                  {loading ? <Skeleton className="h-8 w-32 bg-emerald-500/50" /> : formatCurrency(totalDeposits, currencySymbol)}
                </p>
                <p className="text-2xs text-emerald-100 mt-1">
                  Excludes reversed payments • Directly credited towards member settlement balances
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5 flex flex-col justify-center">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Deposit Transactions
              </span>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {payments.filter((p) => !p.isReversed).length}{' '}
                <span className="text-xs font-normal text-slate-400">
                  valid ({payments.filter((p) => p.isReversed).length} reversed)
                </span>
              </p>
              <span className="text-2xs text-slate-400 mt-1">
                bKash, Nagad, Rocket, Cash, Bank Transfer
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Members ({members.length})</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} {m.roomNumber ? `(Room ${m.roomNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-2xs text-slate-400 self-end sm:self-auto">
            Showing records for: <strong>{getMonthName(currentMonth)}</strong>
          </span>
        </div>

        {isMonthClosed && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            🔒 <strong>Period Closed:</strong> Accounting period {getMonthName(currentMonth)} is closed. Reopen to record or reverse deposits.
          </div>
        )}

        {/* Payments Table Card */}
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle className="text-sm">Payment & Deposit History ({payments.length})</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No deposit transactions found"
                description="Members have not recorded deposits for the selected criteria."
                actionLabel="Record Deposit"
                onAction={openPaymentModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Member Name</th>
                      <th className="px-3 py-3">Method</th>
                      <th className="px-4 py-3">Trx Reference / Note</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((item) => (
                      <tr
                        key={item._id}
                        className={`transition-colors ${
                          item.isReversed ? 'bg-rose-50/30 opacity-60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">
                            {item.memberId?.name || 'Unknown Member'}
                          </span>
                          {item.memberId?.roomNumber && (
                            <span className="text-2xs text-slate-400 block">
                              Room {item.memberId.roomNumber}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <Badge variant="default" className="capitalize">
                            {item.paymentMethod}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.reference && (
                            <span className="font-mono text-2xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 mr-1.5">
                              {item.reference}
                            </span>
                          )}
                          <span>{item.notes || '-'}</span>
                          {item.isReversed && (
                            <span className="block text-2xs text-rose-600 mt-0.5 font-medium">
                              Reversal reason: {item.reversalReason}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-extrabold text-sm whitespace-nowrap">
                          <span
                            className={
                              item.isReversed
                                ? 'line-through text-slate-400'
                                : 'text-emerald-700'
                            }
                          >
                            +{formatCurrency(item.amount, currencySymbol)}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          {item.isReversed ? (
                            <Badge variant="danger" className="text-2xs">
                              Reversed
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-2xs">
                              Confirmed
                            </Badge>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          {!item.isReversed ? (
                            <button
                              onClick={() => {
                                setPaymentToReverse(item);
                                setIsReversalOpen(true);
                              }}
                              disabled={isMonthClosed}
                              className="inline-flex items-center gap-1 text-2xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors disabled:opacity-40"
                              title="Reverse incorrect transaction"
                            >
                              <RotateCcw className="w-3 h-3" /> Reverse
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Audited</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Reversal Modal */}
        {isReversalOpen && paymentToReverse && (
          <Modal
            isOpen={isReversalOpen}
            onClose={() => {
              setIsReversalOpen(false);
              setPaymentToReverse(null);
            }}
            title="Reverse Member Payment"
            description="Reversing voids the deposit from member balance while preserving a permanent audit record."
            maxWidth="max-w-md"
          >
            <form onSubmit={handleReversePayment} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p>
                  <strong>Transaction:</strong> {formatCurrency(paymentToReverse.amount, currencySymbol)} from{' '}
                  <strong>{paymentToReverse.memberId?.name}</strong> on {formatDate(paymentToReverse.date)}
                </p>
                <p className="text-2xs text-rose-600">
                  This transaction will NOT be deleted. It will be marked reversed and excluded from all financial calculations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Reversal (Required)
                </label>
                <textarea
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Member deposited by mistake / Incorrect bKash TrxID / Refunded"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsReversalOpen(false);
                    setPaymentToReverse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="danger" type="submit" isLoading={reversing} icon={RotateCcw}>
                  Confirm Reversal
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
