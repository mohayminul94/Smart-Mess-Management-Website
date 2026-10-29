'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useMess } from '@/context/MessContext';
import { getTodayDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const METHODS = [
  { value: 'cash', label: 'Cash in Hand' },
  { value: 'bKash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other MFS / Method' },
];

export default function AddPaymentModal() {
  const { isPaymentModalOpen, closePaymentModal, triggerRefresh, currencySymbol } = useMess();
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState('2026-10-22');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPaymentModalOpen) {
      setDate(getTodayDate());
      loadMembers();
    }
  }, [isPaymentModalOpen]);

  const loadMembers = async () => {
    try {
      const res = await api.get('/members?active=true');
      if (res?.success) {
        setMembers(res.members || []);
        if (res.members?.length > 0 && !memberId) {
          setMemberId(res.members[0]._id);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId) {
      toast.error('Please select a member.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid deposit amount.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/payments', {
        memberId,
        date,
        amount: parseFloat(amount),
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res?.success) {
        toast.success('Deposit payment recorded successfully!');
        triggerRefresh();
        closePaymentModal();
        setAmount('');
        setReference('');
        setNotes('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record deposit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isPaymentModalOpen}
      onClose={closePaymentModal}
      title="Record Member Deposit"
      description="Record payments deposited by members towards their monthly mess balance."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Member
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            required
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m.roomNumber ? `(Room ${m.roomNumber})` : ''} - {m.phone || 'No phone'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Payment Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={`Deposit Amount in ${currencySymbol} (BDT)`}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Transaction Reference / TrxID (Optional)"
          placeholder="e.g. 9J8271B7 or Bank Slip #"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Advance deposit for meals"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={closePaymentModal}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving} icon={Save}>
            Record Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
