'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useMess } from '@/context/MessContext';
import { getTodayDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, UserCheck } from 'lucide-react';

const CATEGORIES = [
  { value: 'bazar', label: 'Bazar / Groceries (Meal Pool)' },
  { value: 'groceries', label: 'Spices & Essentials (Meal Pool)' },
  { value: 'house_rent', label: 'House Rent (Fixed Cost)' },
  { value: 'electricity', label: 'Electricity Bill (Fixed Cost)' },
  { value: 'gas', label: 'Gas Bill (Fixed Cost)' },
  { value: 'water', label: 'Water Supply (Fixed Cost)' },
  { value: 'wifi', label: 'Wi-Fi Internet (Fixed Cost)' },
  { value: 'cleaning', label: 'Cleaning & Maid (Fixed Cost)' },
  { value: 'other', label: 'Other Mess Expense (Fixed Cost)' },
];

export default function AddExpenseModal() {
  const { isExpenseModalOpen, closeExpenseModal, triggerRefresh, currencySymbol } = useMess();
  const [date, setDate] = useState('2026-10-22');
  const [category, setCategory] = useState('bazar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentSource, setPaymentSource] = useState('mess_cash');
  const [paidByMemberId, setPaidByMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isExpenseModalOpen) {
      setDate(getTodayDate());
      loadMembers();
    }
  }, [isExpenseModalOpen]);

  const loadMembers = async () => {
    try {
      const res = await api.get('/members?active=true');
      if (res?.success) {
        setMembers(res.members || []);
        if (res.members?.length > 0 && !paidByMemberId) {
          setPaidByMemberId(res.members[0]._id);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description for the expense.');
      return;
    }
    if (paymentSource === 'member_personal' && !paidByMemberId) {
      toast.error('Please select the member who paid personally.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/expenses', {
        date,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        receiptUrl: receiptUrl.trim() || undefined,
        paymentSource,
        paidByMemberId: paymentSource === 'member_personal' ? paidByMemberId : null,
      });

      if (res?.success) {
        toast.success('Expense recorded successfully!');
        triggerRefresh();
        closeExpenseModal();
        // Reset form
        setAmount('');
        setDescription('');
        setReceiptUrl('');
        setPaymentSource('mess_cash');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isExpenseModalOpen}
      onClose={closeExpenseModal}
      title="Record New Expense"
      description="Track bazar or fixed mess utility costs with transparent source allocation."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Expense Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={`Amount in ${currencySymbol} (BDT)`}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Description / Items Purchased"
          placeholder="e.g. 5kg Chicken, Rice, Oil, Spices"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Payment Source Selection */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Payment Source: Who paid for this?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentSource('mess_cash')}
              className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                paymentSource === 'mess_cash'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              💵 Mess Cash Pool
              <span className="block text-2xs text-slate-400 font-normal mt-0.5">
                Paid from mess fund
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentSource('member_personal')}
              className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                paymentSource === 'member_personal'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              👤 Member Personally
              <span className="block text-2xs text-slate-400 font-normal mt-0.5">
                Will credit member settlement
              </span>
            </button>
          </div>

          {paymentSource === 'member_personal' && (
            <div className="pt-2 border-t border-slate-200/60">
              <label className="block text-2xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Select Member Who Paid:
              </label>
              <select
                value={paidByMemberId}
                onChange={(e) => setPaidByMemberId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m.roomNumber ? `(Room ${m.roomNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Input
          label="Receipt Image or Memo URL (Optional)"
          placeholder="https://..."
          value={receiptUrl}
          onChange={(e) => setReceiptUrl(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={closeExpenseModal}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving} icon={Save}>
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
