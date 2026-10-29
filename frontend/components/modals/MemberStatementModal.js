'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import { Printer, Download, Utensils, Wallet, Receipt, Calculator } from 'lucide-react';

export default function MemberStatementModal({ memberId, month, isOpen, onClose }) {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && memberId && month) {
      loadStatement();
    }
  }, [isOpen, memberId, month]);

  const loadStatement = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/members/${memberId}/statement?month=${month}`);
      if (res?.success) {
        setStatement(res.statement);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const s = statement?.settlement;
  const m = statement?.member;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Financial Statement"
      description={`Monthly settlement summary for ${getMonthName(month)}`}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="space-y-4 py-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !statement || !s ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Statement data could not be loaded for this period.
        </div>
      ) : (
        <div className="space-y-6 print:p-0">
          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h4 className="text-base font-bold text-slate-900">{m?.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Phone: {m?.phone || 'N/A'} • Room: {m?.roomNumber || 'N/A'} • Status:{' '}
                {m?.isActive ? 'Active' : 'Inactive'}
              </p>
              <p className="text-2xs text-slate-400 mt-1">Period: {getMonthName(month)}</p>
            </div>
            <div className="text-right">
              <span className="text-2xs uppercase tracking-wider font-semibold text-slate-500 block">
                Net Balance
              </span>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <span
                  className={`text-xl font-extrabold ${
                    s.finalBalance > 0
                      ? 'text-rose-600'
                      : s.finalBalance < 0
                      ? 'text-emerald-600'
                      : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(Math.abs(s.finalBalance))}
                </span>
                <Badge
                  variant={
                    s.status === 'Due' ? 'due' : s.status === 'Receivable' ? 'receivable' : 'settled'
                  }
                >
                  {s.status === 'Due'
                    ? 'Due to Mess'
                    : s.status === 'Receivable'
                    ? 'Credit / Advance'
                    : 'Settled'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Transparent Calculation Breakdown */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" /> Transparent Settlement Breakdown
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-2xs text-slate-500 block">Total Meals</span>
                <span className="text-sm font-semibold text-slate-800">{s.totalMeals}</span>
                <span className="text-2xs text-slate-400 block mt-0.5">
                  @ {formatCurrency(s.mealRate)}/meal
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-2xs text-slate-500 block">Meal Cost</span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(s.mealCost)}
                </span>
                <span className="text-2xs text-slate-400 block mt-0.5">Meals × Rate</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-2xs text-slate-500 block">Fixed Utilities Share</span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(s.fixedCostShare)}
                </span>
                <span className="text-2xs text-slate-400 block mt-0.5">Rent, Wi-Fi, Bills</span>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-2xs text-emerald-800 font-semibold block">Total Cost</span>
                <span className="text-sm font-bold text-emerald-900">
                  {formatCurrency(s.totalCost)}
                </span>
                <span className="text-2xs text-emerald-700 block mt-0.5">Meal + Fixed Share</span>
              </div>
            </div>

            {/* Deductions & Balance Equation */}
            <div className="pt-2 text-2xs text-slate-600 space-y-1 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span>Member Total Mess Cost:</span>
                <span className="font-semibold">{formatCurrency(s.totalCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(-) Member Deposits Paid:</span>
                <span className="font-semibold">-{formatCurrency(s.deposits)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(-) Personally Paid Mess Expenses:</span>
                <span className="font-semibold">-{formatCurrency(s.personalExpensePayments)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>(+/-) Opening Balance / Past Carry-forward:</span>
                <span className="font-semibold">
                  {s.openingBalance >= 0 ? '+' : ''}
                  {formatCurrency(s.openingBalance)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-xs text-slate-900">
                <span>Final Settlement Balance:</span>
                <span
                  className={
                    s.finalBalance > 0
                      ? 'text-rose-600'
                      : s.finalBalance < 0
                      ? 'text-emerald-600'
                      : 'text-slate-800'
                  }
                >
                  {formatCurrency(s.finalBalance)} ({s.status})
                </span>
              </div>
            </div>
          </div>

          {/* Meals History Tabular Summary */}
          {statement.meals?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" /> Recorded Meals in {getMonthName(month)} ({statement.meals.length} days)
              </h5>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Date</th>
                      <th className="px-2 py-1.5 text-center">Breakfast</th>
                      <th className="px-2 py-1.5 text-center">Lunch</th>
                      <th className="px-2 py-1.5 text-center">Dinner</th>
                      <th className="px-3 py-1.5 text-right">Day Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.meals.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-50">
                        <td className="px-3 py-1 text-slate-700 font-medium">{formatDate(entry.date)}</td>
                        <td className="px-2 py-1 text-center text-slate-600">{entry.breakfast}</td>
                        <td className="px-2 py-1 text-center text-slate-600">{entry.lunch}</td>
                        <td className="px-2 py-1 text-center text-slate-600">{entry.dinner}</td>
                        <td className="px-3 py-1 text-right font-bold text-emerald-700">
                          {entry.totalMeals}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Deposit Payments History */}
          {statement.payments?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Deposits Paid by Member
              </h5>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3 py-1.5">Date</th>
                      <th className="px-3 py-1.5">Method</th>
                      <th className="px-3 py-1.5">Ref / Notes</th>
                      <th className="px-3 py-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.payments.map((p) => (
                      <tr key={p._id} className={p.isReversed ? 'opacity-50 line-through' : ''}>
                        <td className="px-3 py-1 text-slate-700">{formatDate(p.date)}</td>
                        <td className="px-3 py-1 capitalize text-slate-600">{p.paymentMethod}</td>
                        <td className="px-3 py-1 text-slate-500 text-2xs">{p.reference || p.notes || '-'}</td>
                        <td className="px-3 py-1 text-right font-bold text-slate-900">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Personal Expense Payments */}
          {statement.personalExpenses?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Mess Expenses Personally Paid
              </h5>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3 py-1.5">Date</th>
                      <th className="px-3 py-1.5">Description</th>
                      <th className="px-3 py-1.5">Category</th>
                      <th className="px-3 py-1.5 text-right">Credited Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.personalExpenses.map((exp) => (
                      <tr key={exp._id}>
                        <td className="px-3 py-1 text-slate-700">{formatDate(exp.date)}</td>
                        <td className="px-3 py-1 text-slate-800">{exp.description}</td>
                        <td className="px-3 py-1 capitalize text-slate-500">{exp.category}</td>
                        <td className="px-3 py-1 text-right font-bold text-emerald-700">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 print:hidden">
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
              Print Statement
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
