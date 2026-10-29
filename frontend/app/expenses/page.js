'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMess } from '@/context/MessContext';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  UserCheck,
  Building,
  Utensils,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'bazar', label: 'Bazar / Groceries' },
  { value: 'groceries', label: 'Spices & Staples' },
  { value: 'house_rent', label: 'House Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas', label: 'Gas' },
  { value: 'water', label: 'Water' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

export default function ExpensesPage() {
  const { currentMonth, currencySymbol, refreshTrigger, triggerRefresh, openExpenseModal } = useMess();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMonthClosed, setIsMonthClosed] = useState(false);

  // Delete confirm dialog
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      let query = `month=${currentMonth}`;
      if (selectedCategory !== 'all') {
        query += `&category=${selectedCategory}`;
      }
      if (search.trim()) {
        query += `&search=${encodeURIComponent(search.trim())}`;
      }

      const res = await api.get(`/expenses?${query}`);
      if (res?.success) {
        setExpenses(res.expenses || []);
        setTotalAmount(res.totalAmount || 0);
        setIsMonthClosed(Boolean(res.isMonthClosed));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, selectedCategory, search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshTrigger]);

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/expenses/${expenseToDelete._id}`);
      if (res?.success) {
        toast.success('Expense record deleted successfully');
        triggerRefresh();
        setIsDeleteOpen(false);
        setExpenseToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  // Group sums for Bazar vs Fixed
  const mealPoolCategories = ['bazar', 'groceries'];
  const bazarTotal = expenses
    .filter((e) => mealPoolCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const fixedTotal = expenses
    .filter((e) => !mealPoolCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bazar & Expense Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track daily groceries, fixed utility bills, and out-of-pocket member payments
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={openExpenseModal}>
            Add New Expense
          </Button>
        </div>

        {/* Expense Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-amber-50/70 border-amber-200/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-amber-800">
                  Bazar / Groceries Pool
                </span>
                <p className="text-xl font-extrabold text-amber-900 mt-1">
                  {formatCurrency(bazarTotal, currencySymbol)}
                </p>
                <span className="text-2xs text-amber-700">Divided by total meals</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sky-50/70 border-sky-200/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-sky-800">
                  Fixed Utilities & Rent
                </span>
                <p className="text-xl font-extrabold text-sky-900 mt-1">
                  {formatCurrency(fixedTotal, currencySymbol)}
                </p>
                <span className="text-2xs text-sky-700">Shared equally by active members</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-200/70 text-sky-800 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Monthly Expenses
                </span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {formatCurrency(totalAmount, currencySymbol)}
                </p>
                <span className="text-2xs text-slate-400">
                  {expenses.length} records in {getMonthName(currentMonth)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder="Search expenses by item/description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isMonthClosed && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            🔒 <strong>Period Closed:</strong> Expenses for {getMonthName(currentMonth)} are locked. Reopen the month to add or delete records.
          </div>
        )}

        {/* Expenses Table Card */}
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle className="text-sm">Expense Records ({expenses.length})</CardTitle>
            <span className="text-xs font-semibold text-slate-700">
              Total Filtered: {formatCurrency(totalAmount, currencySymbol)}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expense entries found"
                description="Click 'Add New Expense' to log bazar or utility bills."
                actionLabel="Add Expense"
                onAction={openExpenseModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-4 py-3">Description / Items</th>
                      <th className="px-3 py-3">Paid From</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Receipt</th>
                      <th className="px-3 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>

                        <td className="px-3 py-3">
                          <Badge
                            variant={
                              mealPoolCategories.includes(item.category) ? 'bazar' : 'fixed'
                            }
                            className="capitalize"
                          >
                            {item.category.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {item.description}
                        </td>

                        <td className="px-3 py-3">
                          {item.paymentSource === 'member_personal' && item.paidByMemberId ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs font-semibold">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              {item.paidByMemberId.name} (Credited)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-2xs font-medium">
                              Mess Cash Pool
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm whitespace-nowrap">
                          {formatCurrency(item.amount, currencySymbol)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.receiptUrl ? (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-2xs font-semibold"
                            >
                              View Memo <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => {
                              setExpenseToDelete(item);
                              setIsDeleteOpen(true);
                            }}
                            disabled={isMonthClosed}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setExpenseToDelete(null);
          }}
          onConfirm={handleDeleteExpense}
          title="Delete Expense Record?"
          message={`Are you sure you want to delete the expense "${expenseToDelete?.description}" of ${formatCurrency(
            expenseToDelete?.amount,
            currencySymbol
          )}? This will recalculate the monthly meal rate and balances.`}
          confirmLabel="Delete Expense"
          isDanger={true}
          isLoading={deleting}
        />
      </div>
    </AppLayout>
  );
}
