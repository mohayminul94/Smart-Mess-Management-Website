'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useMess } from '@/context/MessContext';
import { getTodayDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, Save, Loader2 } from 'lucide-react';

export default function QuickMealModal() {
  const { isMealModalOpen, closeMealModal, triggerRefresh } = useMess();
  const [date, setDate] = useState('2026-10-22');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [isMonthClosed, setIsMonthClosed] = useState(false);

  useEffect(() => {
    if (isMealModalOpen) {
      const today = getTodayDate();
      setDate(today);
      loadMealsForDate(today);
    }
  }, [isMealModalOpen]);

  const loadMealsForDate = async (selectedDate) => {
    if (!selectedDate) return;
    try {
      setLoading(true);
      const res = await api.get(`/meals/daily?date=${selectedDate}`);
      if (res?.success) {
        setEntries(res.entries || []);
        setIsMonthClosed(Boolean(res.isMonthClosed));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleMealChange = (memberId, mealType, value) => {
    const num = parseFloat(value) || 0;
    setEntries((prev) =>
      prev.map((item) => {
        if (item.memberId === memberId) {
          const updated = { ...item, [mealType]: num };
          updated.totalMeals =
            Math.round(((updated.breakfast || 0) + (updated.lunch || 0) + (updated.dinner || 0)) * 100) /
            100;
          return updated;
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    if (isMonthClosed) {
      toast.error('Cannot save meals for a closed accounting period.');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/meals/bulk', {
        date,
        entries: entries.map((e) => ({
          memberId: e.memberId,
          breakfast: e.breakfast,
          lunch: e.lunch,
          dinner: e.dinner,
          notes: e.notes,
        })),
      });

      if (res?.success) {
        toast.success(`Meals for ${date} saved successfully!`);
        triggerRefresh();
        closeMealModal();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save meals');
    } finally {
      setSaving(false);
    }
  };

  const totalDayMeals = entries.reduce((acc, curr) => acc + (curr.totalMeals || 0), 0);

  return (
    <Modal
      isOpen={isMealModalOpen}
      onClose={closeMealModal}
      title="Daily Meal Entry"
      description="Quickly record breakfast, lunch, and dinner counts for active members."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Date Selector */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">Select Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                loadMealsForDate(e.target.value);
              }}
              className="text-xs font-medium bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-right">
            <span className="text-2xs uppercase tracking-wider text-slate-500 block">Total Meals</span>
            <span className="text-sm font-bold text-emerald-700">
              {Math.round(totalDayMeals * 100) / 100}
            </span>
          </div>
        </div>

        {isMonthClosed && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            ⚠️ This month has been closed and locked. Reopen the period from settings to edit meals.
          </div>
        )}

        {/* Members Meal Table */}
        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-sm">Loading member records...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No active members found. Please add members first.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="px-4 py-2.5">Member</th>
                  <th className="px-3 py-2.5 text-center w-20">Breakfast</th>
                  <th className="px-3 py-2.5 text-center w-20">Lunch</th>
                  <th className="px-3 py-2.5 text-center w-20">Dinner</th>
                  <th className="px-4 py-2.5 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((item) => (
                  <tr key={item.memberId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {item.memberName}
                      {item.roomNumber && (
                        <span className="ml-1.5 text-2xs text-slate-400 font-normal">
                          (Room {item.roomNumber})
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={isMonthClosed}
                        value={item.breakfast === 0 ? '' : item.breakfast}
                        placeholder="0"
                        onChange={(e) => handleMealChange(item.memberId, 'breakfast', e.target.value)}
                        className="w-16 text-center text-xs font-semibold py-1 rounded border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={isMonthClosed}
                        value={item.lunch === 0 ? '' : item.lunch}
                        placeholder="0"
                        onChange={(e) => handleMealChange(item.memberId, 'lunch', e.target.value)}
                        className="w-16 text-center text-xs font-semibold py-1 rounded border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={isMonthClosed}
                        value={item.dinner === 0 ? '' : item.dinner}
                        placeholder="0"
                        onChange={(e) => handleMealChange(item.memberId, 'dinner', e.target.value)}
                        className="w-16 text-center text-xs font-semibold py-1 rounded border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-700">
                      {item.totalMeals || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={closeMealModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={isMonthClosed || entries.length === 0}
            icon={Save}
          >
            Save All Meals
          </Button>
        </div>
      </div>
    </Modal>
  );
}
