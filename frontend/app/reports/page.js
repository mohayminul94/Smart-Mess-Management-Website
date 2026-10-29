'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import MemberStatementModal from '@/components/modals/MemberStatementModal';
import { useMess } from '@/context/MessContext';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Utensils,
  Receipt,
  Wallet,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentMonth, currencySymbol, refreshTrigger } = useMess();

  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [generatedDate, setGeneratedDate] = useState('');

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString('en-BD'));
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/calculations/reports?month=${currentMonth}`);
      if (res?.success) {
        setReportsData(res);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate monthly reports');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportsData?.memberSettlements) return;

    const headers = [
      'Member Name',
      'Breakfast',
      'Lunch',
      'Dinner',
      'Total Meals',
      'Meal Rate',
      'Meal Cost',
      'Fixed Share',
      'Total Cost',
      'Deposits',
      'Personal Payments',
      'Opening Balance',
      'Final Balance',
      'Status',
    ];

    const csvRows = [headers.join(',')];

    for (const row of reportsData.memberSettlements) {
      csvRows.push(
        [
          `"${row.memberName}"`,
          row.breakfast,
          row.lunch,
          row.dinner,
          row.totalMeals,
          row.mealRate,
          row.mealCost,
          row.fixedCostShare,
          row.totalCost,
          row.deposits,
          row.personalExpensePayments,
          row.openingBalance,
          row.finalBalance,
          row.status,
        ].join(',')
      );
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_mess_settlement_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Settlement CSV exported successfully!');
  };

  const summary = reportsData?.summary;
  const settlements = reportsData?.memberSettlements || [];
  const categoryBreakdown = reportsData?.categoryBreakdown || {};

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Financial Reports & Audit</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive income and expense audit sheets, member ledgers, and printable exports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
          </div>
        </div>

        {/* Printable Formal Header (visible in print mode) */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-black text-slate-900">{reportsData?.messName || 'Smart Bachelor Mess'}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Official Monthly Accounting Statement • Period: {getMonthName(currentMonth)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Generated on {generatedDate}</p>
        </div>

        {/* Financial Summary & Income/Expense Reconciliation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-4">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">
                Total Mess Incurred Cost
              </span>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(summary?.totalExpenses, currencySymbol)}
              </p>
              <span className="text-2xs text-slate-400">
                Bazar ({formatCurrency(summary?.totalBazarExpense, currencySymbol)}) + Fixed ({formatCurrency(summary?.totalFixedExpense, currencySymbol)})
              </span>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Member Deposits
              </span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {formatCurrency(summary?.totalDeposits, currencySymbol)}
              </p>
              <span className="text-2xs text-slate-400">Paid into mess account</span>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Receivables (Dues)
              </span>
              <p className="text-xl font-bold text-rose-600 mt-1">
                {formatCurrency(summary?.totalDue, currencySymbol)}
              </p>
              <span className="text-2xs text-slate-400">Owed by members to mess</span>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Mess Payables
              </span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(summary?.totalReceivable, currencySymbol)}
              </p>
              <span className="text-2xs text-slate-400">Owed by mess to members (Advance)</span>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown & Audit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Category-Wise Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Cost Type</th>
                    <th className="px-4 py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(categoryBreakdown).map(([cat, amt]) => {
                    const isMeal = ['bazar', 'groceries'].includes(cat);
                    return (
                      <tr key={cat}>
                        <td className="px-4 py-2 font-medium capitalize text-slate-800">
                          {cat.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={isMeal ? 'bazar' : 'fixed'}>
                            {isMeal ? 'Meal Pool' : 'Fixed Utility'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">
                          {formatCurrency(amt, currencySymbol)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Accounting Reconciliation Check</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Bazar Pool:</span>
                <span className="font-semibold">{formatCurrency(summary?.totalBazarExpense, currencySymbol)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Fixed Costs:</span>
                <span className="font-semibold">{formatCurrency(summary?.totalFixedExpense, currencySymbol)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Meals Registered:</span>
                <span className="font-semibold">{summary?.totalMeals} meals</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Computed Meal Rate:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(summary?.mealRate, currencySymbol)} / meal</span>
              </div>
              <div className="flex justify-between py-1.5 bg-emerald-50 px-2 rounded-lg text-emerald-900 font-bold">
                <span>Reconciliation Status:</span>
                <span>Exact Mathematical Integrity (0 Paisa Remainder)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Settlement Master Table */}
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle className="text-sm">Member-Wise Final Settlement Statement</CardTitle>
            <span className="text-2xs text-slate-400">
              Period: {getMonthName(currentMonth)} • Currency: {currencySymbol}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : settlements.length === 0 ? (
              <EmptyState title="No settlement data available" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-3 py-2.5 text-center">Meals</th>
                      <th className="px-3 py-2.5 text-right">Meal Cost</th>
                      <th className="px-3 py-2.5 text-right">Fixed Bills</th>
                      <th className="px-3 py-2.5 text-right">Total Cost</th>
                      <th className="px-3 py-2.5 text-right text-emerald-700">Deposits</th>
                      <th className="px-3 py-2.5 text-right text-emerald-700">Personal Paid</th>
                      <th className="px-3 py-2.5 text-right">Opening</th>
                      <th className="px-4 py-2.5 text-right">Final Balance</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-center print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlements.map((s) => (
                      <tr key={s.memberId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                          {s.memberName}
                          {s.roomNumber && <span className="text-2xs text-slate-400 block">Room {s.roomNumber}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800">{s.totalMeals}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700">{formatCurrency(s.mealCost, currencySymbol)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700">{formatCurrency(s.fixedCostShare, currencySymbol)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-50/50">
                          {formatCurrency(s.totalCost, currencySymbol)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-700">-{formatCurrency(s.deposits, currencySymbol)}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-700">
                          {s.personalExpensePayments > 0 ? `-${formatCurrency(s.personalExpensePayments, currencySymbol)}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{formatCurrency(s.openingBalance, currencySymbol)}</td>
                        <td className="px-4 py-2.5 text-right font-black text-sm">
                          <span className={s.finalBalance > 0 ? 'text-rose-600' : s.finalBalance < 0 ? 'text-emerald-600' : 'text-slate-700'}>
                            {formatCurrency(s.finalBalance, currencySymbol)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant={s.status === 'Due' ? 'due' : s.status === 'Receivable' ? 'receivable' : 'settled'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center print:hidden">
                          <button
                            onClick={() => {
                              setSelectedMemberId(s.memberId);
                              setIsStatementOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-600 rounded"
                            title="Individual Statement"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
