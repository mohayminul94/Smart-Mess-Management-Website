'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useMess } from '@/context/MessContext';
import { getTodayDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, UserPlus } from 'lucide-react';

export default function AddMemberModal({ memberToEdit = null, isOpenOverride, onCloseOverride }) {
  const { isMemberModalOpen, closeMemberModal, triggerRefresh, currencySymbol } = useMess();
  const isOpen = isOpenOverride !== undefined ? isOpenOverride : isMemberModalOpen;
  const onClose = onCloseOverride || closeMemberModal;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [joinDate, setJoinDate] = useState('2026-10-22');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || '');
      setPhone(memberToEdit.phone || '');
      setEmail(memberToEdit.email || '');
      setRoomNumber(memberToEdit.roomNumber || '');
      setJoinDate(
        memberToEdit.joinDate
          ? new Date(memberToEdit.joinDate).toISOString().substring(0, 10)
          : getTodayDate()
      );
      setOpeningBalance(String(memberToEdit.openingBalance || 0));
      setNotes(memberToEdit.notes || '');
    } else if (isOpen) {
      setName('');
      setPhone('');
      setEmail('');
      setRoomNumber('');
      setJoinDate(getTodayDate());
      setOpeningBalance('0');
      setNotes('');
    }
  }, [memberToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Member name is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        joinDate,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: notes.trim() || undefined,
      };

      let res;
      if (memberToEdit?._id) {
        res = await api.put(`/members/${memberToEdit._id}`, payload);
      } else {
        res = await api.post('/members', payload);
      }

      if (res?.success) {
        toast.success(
          memberToEdit ? 'Member updated successfully!' : 'New member added successfully!'
        );
        triggerRefresh();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberToEdit ? 'Edit Member Profile' : 'Add New Mess Member'}
      description="Manage bachelor mess resident details and balance accounts."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Rahim Ahmed"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            placeholder="017xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Room Number / Seat"
            placeholder="e.g. 301-A"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Join Date"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
            required
          />
          <Input
            label={`Opening Balance (${currencySymbol})`}
            type="number"
            step="0.01"
            helperText="+ owes mess, - credit"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
        </div>

        <Input
          label="Email Address (Optional)"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Notes (Optional)"
          placeholder="e.g. University student, pays via bKash"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving} icon={Save}>
            {memberToEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
