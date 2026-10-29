'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import MemberStatementModal from '@/components/modals/MemberStatementModal';
import { useMess } from '@/context/MessContext';
import { formatCurrency, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Calculator,
  Search,
  ArrowUpDown,
  FileText,
  HelpCircle,
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle,
} from 'lucide-react';

export default function CalculationsPage() {
  const { currentMonth, currencySymbol, refreshTrigger } = useMess();

  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Due', 'Receivable', 'Settled'
  const [sortField, setSortField] = useState('finalBalance'); // 'name', 'totalMeals', 'totalCost', 'finalBalance'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Statement modal
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const fetchCalculations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/calculations/monthly?month=${currentMonth}`);
      if (res?.success) {
        setCalculation(res.calculation);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to calculate monthly settlements');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations, refreshTrigger]);

  const summary = calculation?.summary;
  let rows = calculation?.memberSettlements || [];

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.memberName.toLowerCase().includes(q) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
    );
  }

  // Filter by status
  if (statusFilter !== 'all') {
    rows = rows.filter((r) => r.status === statusFilter);
  }

  // Sort
  rows = [...rows].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Individual Calculations & Settlement</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent member-wise cost allocation and balance sheet for {getMonthName(currentMonth)}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-900 font-semibold">
              Meal Rate: {formatCurrency(summary?.mealRate || 0, currencySymbol)} / meal
            </span>
          </div>
        </div>

        {/* Calculation Rule Card Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Automated Calculation Formula & Sign Convention
            </h3>
            <span className="text-2xs text-slate-400">Paisa-accurate integer reconciliation</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-2xs text-slate-300 pt-1 leading-relaxed">
            <div>
              <strong className="text-slate-100 block mb-0.5">1. Meal Cost:</strong>
              Meal Rate = Total Bazar Expenses ÷ Total Meals.
              <br />
              Member Meal Cost = Total Member Meals × Meal Rate.
            </div>
            <div>
              <strong className="text-slate-100 block mb-0.5">2. Fixed Utilities Share:</strong>
              Rent, Electricity, Gas, Wi-Fi & Cleaning divided equally among active eligible residents with zero remainder leakage.
            </div>
            <div>
              <strong className="text-slate-100 block mb-0.5">3. Final Settlement Balance:</strong>
              Total Cost - Deposits - Personal Payments + Opening Balance.
              <br />
              <span className="text-rose-400 font-semibold">(+) Positive = Member Owes Mess (Due)</span> |{' '}
              <span className="text-emerald-400 font-semibold">(-) Negative = Mess Owes Member (Advance Credit)</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder="Search member name or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto self-end">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold mr-1">
              Filter Status:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Due')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'Due'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Due ({calculation?.memberSettlements?.filter((r) => r.status === 'Due').length || 0})
            </button>
            <button
              onClick={() => setStatusFilter('Receivable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'Receivable'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Credit ({calculation?.memberSettlements?.filter((r) => r.status === 'Receivable').length || 0})
            </button>
            <button
              onClick={() => setStatusFilter('Settled')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'Settled'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Settled
            </button>
          </div>
        </div>

        {/* Calculations Sheet Card */}
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle className="text-sm">Monthly Settlement Ledger ({rows.length} Members)</CardTitle>
            <div className="flex items-center gap-3 text-2xs text-slate-500">
              <span>
                Total Due to Mess: <strong className="text-rose-600">{formatCurrency(summary?.totalDue || 0, currencySymbol)}</strong>
              </span>
              <span>•</span>
              <span>
                Total Advance Credits: <strong className="text-emerald-600">{formatCurrency(summary?.totalReceivable || 0, currencySymbol)}</strong>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={Calculator}
                title="No calculation records found"
                description="Add members and record meals or expenses to generate settlements."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('memberName')}>
                        <span className="flex items-center gap-1">
                          Member Name <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center">B / L / D</th>
                      <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => toggleSort('totalMeals')}>
                        <span className="flex items-center justify-center gap-1">
                          Meals <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right">Meal Cost</th>
                      <th className="px-3 py-3 text-right">Fixed Bills</th>
                      <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort('totalCost')}>
                        <span className="flex items-center justify-end gap-1">
                          Total Cost <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right text-emerald-700">Deposits</th>
                      <th className="px-3 py-3 text-right text-emerald-700">Personal Paid</th>
                      <th className="px-3 py-3 text-right">Opening Bal</th>
                      <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort('finalBalance')}>
                        <span className="flex items-center justify-end gap-1 font-bold">
                          Final Balance <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-3 py-3 text-center">Statement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.memberId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">{row.memberName}</span>
                          {row.roomNumber && (
                            <span className="text-2xs text-slate-400 block">Room {row.roomNumber}</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center text-slate-500 text-2xs">
                          {row.breakfast} / {row.lunch} / {row.dinner}
                        </td>

                        <td className="px-3 py-3 text-center font-bold text-slate-800">
                          {row.totalMeals}
                        </td>

                        <td className="px-3 py-3 text-right text-slate-700 font-medium">
                          {formatCurrency(row.mealCost, currencySymbol)}
                        </td>

                        <td className="px-3 py-3 text-right text-slate-700 font-medium">
                          {formatCurrency(row.fixedCostShare, currencySymbol)}
                        </td>

                        <td className="px-3 py-3 text-right font-bold text-slate-900 bg-slate-50/40">
                          {formatCurrency(row.totalCost, currencySymbol)}
                        </td>

                        <td className="px-3 py-3 text-right text-emerald-700 font-medium">
                          -{formatCurrency(row.deposits, currencySymbol)}
                        </td>

                        <td className="px-3 py-3 text-right text-emerald-700 font-medium">
                          {row.personalExpensePayments > 0
                            ? `-${formatCurrency(row.personalExpensePayments, currencySymbol)}`
                            : '-'}
                        </td>

                        <td className="px-3 py-3 text-right text-slate-500">
                          {row.openingBalance !== 0
                            ? `${row.openingBalance > 0 ? '+' : ''}${formatCurrency(row.openingBalance, currencySymbol)}`
                            : '0.00'}
                        </td>

                        <td className="px-4 py-3 text-right font-black text-sm">
                          <span
                            className={
                              row.finalBalance > 0
                                ? 'text-rose-600'
                                : row.finalBalance < 0
                                ? 'text-emerald-600'
                                : 'text-slate-700'
                            }
                          >
                            {formatCurrency(row.finalBalance, currencySymbol)}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <Badge
                            variant={
                              row.status === 'Due'
                                ? 'due'
                                : row.status === 'Receivable'
                                ? 'receivable'
                                : 'settled'
                            }
                          >
                            {row.status === 'Due'
                              ? 'Due'
                              : row.status === 'Receivable'
                              ? 'Credit'
                              : 'Settled'}
                          </Badge>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedMemberId(row.memberId);
                              setIsStatementOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="View Full Calculation Breakdown"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-2xs text-slate-700">
                        Total Reconciled
                      </td>
                      <td className="px-3 py-3 text-center text-slate-900">
                        {summary?.totalMeals || 0}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        {formatCurrency(summary?.totalBazarExpense || 0, currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        {formatCurrency(summary?.totalFixedExpense || 0, currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        {formatCurrency(summary?.totalExpenses || 0, currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-800">
                        -{formatCurrency(summary?.totalDeposits || 0, currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-800">
                        -{formatCurrency(summary?.totalPersonalExpensePayments || 0, currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right text-slate-900 text-sm">
                        Net {formatCurrency((summary?.totalDue || 0) - (summary?.totalReceivable || 0), currencySymbol)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Statement Modal */}
        {selectedMemberId && (
          <MemberStatementModal
            memberId={selectedMemberId}
            month={currentMonth}
            isOpen={isStatementOpen}
            onClose={() => {
              setIsStatementOpen(false);
              setSelectedMemberId(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
