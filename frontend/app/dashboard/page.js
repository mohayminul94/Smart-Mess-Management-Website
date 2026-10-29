'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useMess } from '@/context/MessContext';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import {
  Utensils,
  Receipt,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6', '#6366f1'];

export default function DashboardPage() {
  const {
    currentMonth,
    currencySymbol,
    refreshTrigger,
    openMealModal,
    openExpenseModal,
    openPaymentModal,
    openMemberModal,
  } = useMess();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/calculations/dashboard?month=${currentMonth}`);
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const stats = data?.stats;
  const charts = data?.charts;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated reconciliation & meal rates for {getMonthName(currentMonth)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Utensils}
              onClick={openMealModal}
              className="text-xs bg-white"
            >
              + Daily Meals
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Receipt}
              onClick={openExpenseModal}
              className="text-xs bg-white"
            >
              + Add Expense
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Wallet}
              onClick={openPaymentModal}
              className="text-xs shadow-xs"
            >
              + Record Deposit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Users}
              onClick={openMemberModal}
              className="text-xs"
            >
              + Member
            </Button>
          </div>
        </div>

        {/* Warning banner if period is closed or zero meals with bazar expense */}
        {data?.periodStatus === 'closed' && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Accounting period for <strong>{getMonthName(currentMonth)}</strong> is <strong>Closed</strong>. All financial records are finalized and locked against direct edits.
              </span>
            </div>
            <a
              href="/settings"
              className="font-semibold text-amber-900 underline hover:text-amber-700 whitespace-nowrap"
            >
              Manage in Settings
            </a>
          </div>
        )}

        {stats?.hasZeroMealsWarning && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Zero Meals Recorded:</strong> Bazar expenses exist for this month but no meal entries have been registered yet. Meal rate will calculate once meals are recorded.
            </span>
          </div>
        )}

        {/* 9 Key Financial Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Meal Rate */}
          <Card className="bg-emerald-600 text-white border-emerald-500 shadow-sm col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-emerald-100">
                <span className="text-2xs font-semibold uppercase tracking-wider">Meal Rate</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-7 w-20 bg-emerald-500/50" /> : `${currencySymbol} ${stats?.mealRate || 0}`}
                </span>
                <span className="text-2xs text-emerald-100">/ meal</span>
              </div>
              <p className="mt-1 text-2xs text-emerald-100">
                Total Meals: <strong>{stats?.totalMeals || 0}</strong>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Bazar Expense */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Bazar Expenses</span>
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalBazarExpense, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Direct meal groceries pool</p>
            </CardContent>
          </Card>

          {/* Card 3: Fixed Bills */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Fixed Utilities</span>
                <Receipt className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalFixedExpense, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Rent, Wi-Fi, Gas, Cleaning</p>
            </CardContent>
          </Card>

          {/* Card 4: Total Expenses */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Total Mess Cost</span>
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalExpenses, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Bazar + All Fixed Bills</p>
            </CardContent>
          </Card>

          {/* Card 5: Member Deposits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Total Deposits</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-emerald-700">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalDeposits, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Member cash/MFS receipts</p>
            </CardContent>
          </Card>

          {/* Card 6: Personal Mess Expense Payments */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Personal Credits</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-800">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalPersonalExpensePayments, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Paid out-of-pocket by members</p>
            </CardContent>
          </Card>

          {/* Card 7: Total Unpaid Due */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Unpaid Balances</span>
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-rose-600">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalDue, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Members owe to the mess</p>
            </CardContent>
          </Card>

          {/* Card 8: Member Receivables (Advance Credits) */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Mess Receivables</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-emerald-600">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats?.totalReceivable, currencySymbol)}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Mess owes to members (Advance)</p>
            </CardContent>
          </Card>

          {/* Card 9: Active Members */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-2xs font-semibold uppercase tracking-wider">Active Members</span>
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-800">
                {loading ? <Skeleton className="h-6 w-12" /> : stats?.activeMembersCount || 0}
              </div>
              <p className="mt-1 text-2xs text-slate-400">Sharing monthly costs</p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Meal Consumption Trend (Area Chart) */}
          <Card className="lg:col-span-2">
            <CardHeader className="py-3.5">
              <div>
                <CardTitle className="text-sm">Daily Meal Consumption Trend</CardTitle>
                <CardDescription>Total meals recorded each day in {getMonthName(currentMonth)}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : !charts?.dailyMealTrend || charts.dailyMealTrend.length === 0 ? (
                <EmptyState
                  icon={Utensils}
                  title="No daily meals recorded yet"
                  description="Use the '+ Daily Meals' button to log member meals for this month."
                  actionLabel="Record Meals"
                  onAction={openMealModal}
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.dailyMealTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mealGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(val) => [`${val} meals`, 'Total Meals']}
                        labelFormatter={(label) => `Day ${label}`}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#mealGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown by Category (Donut Chart) */}
          <Card>
            <CardHeader className="py-3.5">
              <div>
                <CardTitle className="text-sm">Expense Breakdown</CardTitle>
                <CardDescription>Category-wise cost distribution</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : !charts?.expenseCategoryList || charts.expenseCategoryList.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses logged"
                  description="Record bazar or fixed utilities to see the breakdown."
                  actionLabel="Add Expense"
                  onAction={openExpenseModal}
                />
              ) : (
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={charts.expenseCategoryList}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {charts.expenseCategoryList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${currencySymbol} ${val}`, 'Amount']}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-1 max-h-14 overflow-y-auto">
                    {charts.expenseCategoryList.map((item, idx) => (
                      <span key={item.name} className="flex items-center gap-1 text-2xs text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        {item.name}: {currencySymbol}{item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Members with Due & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members with Outstanding Balances Widget */}
          <Card>
            <CardHeader className="py-3.5">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="text-sm text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Outstanding Dues
                  </CardTitle>
                  <CardDescription>Members who owe money to the mess</CardDescription>
                </div>
                <a href="/calculations" className="text-2xs font-semibold text-emerald-600 hover:text-emerald-700">
                  View All &rarr;
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !data?.membersWithDue || data.membersWithDue.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span className="font-medium text-slate-700">All balances are settled!</span>
                  <span>No outstanding dues for this month.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {data.membersWithDue.map((m) => (
                    <div key={m.memberId} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70">
                      <div>
                        <p className="font-medium text-slate-800">{m.memberName}</p>
                        <p className="text-2xs text-slate-400">
                          Meals: {m.totalMeals} • Cost: {formatCurrency(m.totalCost, currencySymbol)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 text-sm">
                          {formatCurrency(m.finalBalance, currencySymbol)}
                        </span>
                        <span className="block text-2xs text-rose-500 uppercase font-semibold">Due</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity: Expenses & Payments */}
          <Card className="lg:col-span-2">
            <CardHeader className="py-3.5">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="text-sm">Recent Financial Transactions</CardTitle>
                  <CardDescription>Latest logged bazar, utility bills, and member deposits</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/expenses" className="text-2xs font-semibold text-emerald-600 hover:underline">
                    Expenses
                  </a>
                  <span className="text-slate-300">•</span>
                  <a href="/payments" className="text-2xs font-semibold text-emerald-600 hover:underline">
                    Deposits
                  </a>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (!data?.recentExpenses?.length && !data?.recentPayments?.length) ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No recent transactions recorded for {getMonthName(currentMonth)}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Recent Expenses */}
                  {data.recentExpenses?.slice(0, 3).map((exp) => (
                    <div key={exp._id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{exp.description}</p>
                          <p className="text-2xs text-slate-400">
                            {formatDate(exp.date)} • <span className="capitalize">{exp.category}</span>
                            {exp.paymentSource === 'member_personal' && exp.paidByMemberId && (
                              <span className="text-emerald-600 ml-1 font-medium">
                                (Paid by {exp.paidByMemberId.name})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          -{formatCurrency(exp.amount, currencySymbol)}
                        </span>
                        <Badge variant="bazar" className="ml-2">Expense</Badge>
                      </div>
                    </div>
                  ))}

                  {/* Recent Deposits */}
                  {data.recentPayments?.slice(0, 3).map((pay) => (
                    <div key={pay._id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            Deposit from {pay.memberId?.name || 'Member'}
                          </p>
                          <p className="text-2xs text-slate-400">
                            {formatDate(pay.date)} • Via <span className="capitalize">{pay.paymentMethod}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">
                          +{formatCurrency(pay.amount, currencySymbol)}
                        </span>
                        <Badge variant="success" className="ml-2">Deposit</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
