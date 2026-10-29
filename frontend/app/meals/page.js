'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useMess } from '@/context/MessContext';
import { getTodayDate, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Utensils,
  Calendar,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function MealsPage() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useMess();
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [dayTotals, setDayTotals] = useState({ breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0 });
  const [isMonthClosed, setIsMonthClosed] = useState(false);

  // Monthly summary tab
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'monthly_summary'
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Initialize client date inside useEffect
  useEffect(() => {
    setSelectedDate(getTodayDate());
  }, []);

  // Load meals for date
  const fetchMealsForDate = useCallback(async (date) => {
    if (!date) return;
    try {
      setLoading(true);
      const res = await api.get(`/meals/daily?date=${date}`);
      if (res?.success) {
        setEntries(res.entries || []);
        setDayTotals(res.totals || { breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0 });
        setIsMonthClosed(Boolean(res.isMonthClosed));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch meals for date');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load monthly summary
  const fetchMonthlySummary = useCallback(async (month) => {
    try {
      setSummaryLoading(true);
      const res = await api.get(`/meals/summary?month=${month}`);
      if (res?.success) {
        setMonthlySummary(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMealsForDate(selectedDate);
  }, [fetchMealsForDate, selectedDate, refreshTrigger]);

  useEffect(() => {
    if (activeTab === 'monthly_summary') {
      fetchMonthlySummary(currentMonth);
    }
  }, [activeTab, fetchMonthlySummary, currentMonth, refreshTrigger]);

  const handleMealChange = (memberId, mealType, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.memberId === memberId) {
          const updated = { ...entry, [mealType]: num };
          updated.totalMeals =
            Math.round(
              ((updated.breakfast || 0) + (updated.lunch || 0) + (updated.dinner || 0)) * 100
            ) / 100;
          return updated;
        }
        return entry;
      })
    );
  };

  const handleQuickFillAll = (breakfast = 1, lunch = 1, dinner = 1) => {
    if (isMonthClosed) return;
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        breakfast,
        lunch,
        dinner,
        totalMeals: breakfast + lunch + dinner,
      }))
    );
    toast.success('Quick-filled standard full meals for all members.');
  };

  const handleSaveBulk = async () => {
    if (isMonthClosed) {
      toast.error('Cannot save meals for a closed accounting period.');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/meals/bulk', {
        date: selectedDate,
        entries: entries.map((e) => ({
          memberId: e.memberId,
          breakfast: e.breakfast,
          lunch: e.lunch,
          dinner: e.dinner,
          notes: e.notes,
        })),
      });

      if (res?.success) {
        toast.success(`Meals for ${selectedDate} saved successfully!`);
        triggerRefresh();
        fetchMealsForDate(selectedDate);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save meals');
    } finally {
      setSaving(false);
    }
  };

  const shiftDay = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().substring(0, 10);
    setSelectedDate(newDate);
  };

  const calculatedDayTotal = entries.reduce((acc, curr) => acc + (curr.totalMeals || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Meal Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bulk daily entry, fractional meals (0.5), and month-to-date meal tracking
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'daily'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Daily Entry Sheet
            </button>
            <button
              onClick={() => setActiveTab('monthly_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'monthly_summary'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Monthly Meal Trends
            </button>
          </div>
        </div>

        {activeTab === 'daily' ? (
          <>
            {/* Date Selector & Day Summary Ribbon */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftDay(-1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                    ({formatDate(selectedDate)})
                  </span>
                </div>

                <button
                  onClick={() => shiftDay(1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions & Totals */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                    Quick Preset:
                  </span>
                  <button
                    onClick={() => handleQuickFillAll(1, 1, 1)}
                    disabled={isMonthClosed}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    All 1-1-1
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => handleQuickFillAll(0.5, 1, 1)}
                    disabled={isMonthClosed}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    Half Breakfast
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => handleQuickFillAll(0, 0, 0)}
                    disabled={isMonthClosed}
                    className="text-slate-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveBulk}
                  isLoading={saving}
                  disabled={isMonthClosed || entries.length === 0}
                  icon={Save}
                  className="shadow-xs"
                >
                  Save Day Meals ({Math.round(calculatedDayTotal * 100) / 100})
                </Button>
              </div>
            </div>

            {isMonthClosed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                🔒 <strong>Period Closed:</strong> Meals for {selectedDate.substring(0, 7)} are finalized and locked against modification.
              </div>
            )}

            {/* Daily Meal Entry Table Card */}
            <Card>
              <CardHeader className="py-3.5">
                <CardTitle className="text-sm">
                  Meal Attendance Sheet for {formatDate(selectedDate)}
                </CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Day Total: <strong className="text-emerald-700 font-bold">{Math.round(calculatedDayTotal * 100) / 100} meals</strong>
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
                ) : entries.length === 0 ? (
                  <EmptyState
                    icon={Utensils}
                    title="No eligible members found"
                    description="Please add active members first to record daily meals."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                        <tr>
                          <th className="px-4 py-3">Member Name</th>
                          <th className="px-3 py-3">Room / Seat</th>
                          <th className="px-3 py-3 text-center w-28">Breakfast</th>
                          <th className="px-3 py-3 text-center w-28">Lunch</th>
                          <th className="px-3 py-3 text-center w-28">Dinner</th>
                          <th className="px-4 py-3 text-right w-28">Day Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entries.map((item) => (
                          <tr key={item.memberId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                              {item.memberName}
                              {!item.isActive && (
                                <Badge variant="inactive" className="ml-2 text-2xs">
                                  Inactive
                                </Badge>
                              )}
                            </td>

                            <td className="px-3 py-2.5 text-slate-500">
                              {item.roomNumber ? `Room ${item.roomNumber}` : '-'}
                            </td>

                            {/* Breakfast */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                disabled={isMonthClosed}
                                value={item.breakfast === 0 ? '' : item.breakfast}
                                placeholder="0"
                                onChange={(e) =>
                                  handleMealChange(item.memberId, 'breakfast', e.target.value)
                                }
                                className="w-20 text-center py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                              />
                            </td>

                            {/* Lunch */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                disabled={isMonthClosed}
                                value={item.lunch === 0 ? '' : item.lunch}
                                placeholder="0"
                                onChange={(e) =>
                                  handleMealChange(item.memberId, 'lunch', e.target.value)
                                }
                                className="w-20 text-center py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                              />
                            </td>

                            {/* Dinner */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                disabled={isMonthClosed}
                                value={item.dinner === 0 ? '' : item.dinner}
                                placeholder="0"
                                onChange={(e) =>
                                  handleMealChange(item.memberId, 'dinner', e.target.value)
                                }
                                className="w-20 text-center py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                              />
                            </td>

                            {/* Day Total */}
                            <td className="px-4 py-2.5 text-right font-extrabold text-sm text-emerald-700">
                              {item.totalMeals || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-slate-800 uppercase tracking-wider text-2xs">
                            Day Aggregate Total
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700">
                            {entries.reduce((a, b) => a + (b.breakfast || 0), 0)}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700">
                            {entries.reduce((a, b) => a + (b.lunch || 0), 0)}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700">
                            {entries.reduce((a, b) => a + (b.dinner || 0), 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-800 text-sm">
                            {Math.round(calculatedDayTotal * 100) / 100}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Monthly Summary Tab */
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-3.5">
                <CardTitle className="text-sm">Monthly Daily Meal Trends ({getMonthName(currentMonth)})</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {summaryLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : !monthlySummary?.dailyTrends?.length ? (
                  <EmptyState title="No meals logged in this month" description="Record daily meals to generate trend charts." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySummary.dailyTrends}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => d.substring(8)}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="breakfast" name="Breakfast" stackId="a" fill="#38bdf8" />
                        <Bar dataKey="lunch" name="Lunch" stackId="a" fill="#10b981" />
                        <Bar dataKey="dinner" name="Dinner" stackId="a" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Monthly Meal Totals Table */}
            <Card>
              <CardHeader className="py-3.5">
                <CardTitle className="text-sm">Member-wise Meal Summary for {getMonthName(currentMonth)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                      <tr>
                        <th className="px-4 py-2.5">Member</th>
                        <th className="px-3 py-2.5 text-center">Breakfasts</th>
                        <th className="px-3 py-2.5 text-center">Lunches</th>
                        <th className="px-3 py-2.5 text-center">Dinners</th>
                        <th className="px-4 py-2.5 text-right">Total Meals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlySummary?.memberSummaries?.map((m) => (
                        <tr key={m.memberId} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{m.name}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{m.breakfast}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{m.lunch}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{m.dinner}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-700 text-sm">
                            {m.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
