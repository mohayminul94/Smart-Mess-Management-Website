'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useMess } from '@/context/MessContext';
import { useAuth } from '@/context/AuthContext';
import { getMonthName, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Settings,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentMonth, mess, refreshMess, triggerRefresh, currencySymbol } = useMess();
  const { user } = useAuth();

  // Mess general settings form
  const [messName, setMessName] = useState('');
  const [messAddress, setMessAddress] = useState('');
  const [symbol, setSymbol] = useState('৳');
  const [savingSettings, setSavingSettings] = useState(false);

  // Monthly Period Status
  const [periodStatus, setPeriodStatus] = useState('open');
  const [periodData, setPeriodData] = useState(null);
  const [loadingPeriod, setLoadingPeriod] = useState(true);

  // Closing / Reopening modals
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    if (mess) {
      setMessName(mess.name || '');
      setMessAddress(mess.address || '');
      setSymbol(mess.currencySymbol || '৳');
    }
  }, [mess]);

  const fetchPeriodStatus = useCallback(async () => {
    try {
      setLoadingPeriod(true);
      const res = await api.get(`/mess/period-status?month=${currentMonth}`);
      if (res?.success) {
        setPeriodStatus(res.period?.status || 'open');
        setPeriodData(res.period);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPeriod(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchPeriodStatus();
  }, [fetchPeriodStatus]);

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.put('/mess/settings', {
        name: messName.trim(),
        address: messAddress.trim(),
        currencySymbol: symbol.trim(),
      });
      if (res?.success) {
        toast.success('Mess settings updated successfully!');
        refreshMess();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCloseMonth = async () => {
    try {
      setClosing(true);
      const res = await api.post('/mess/close-period', {
        month: currentMonth,
        notes: closeNotes.trim() || undefined,
      });
      if (res?.success) {
        toast.success(`Accounting period ${currentMonth} finalized and closed!`);
        setIsCloseModalOpen(false);
        fetchPeriodStatus();
        triggerRefresh();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close monthly period');
    } finally {
      setClosing(false);
    }
  };

  const handleReopenMonth = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      toast.error('A clear reason of at least 5 characters is required to reopen a closed month.');
      return;
    }
    try {
      setReopening(true);
      const res = await api.post('/mess/reopen-period', {
        month: currentMonth,
        reopenReason: reopenReason.trim(),
      });
      if (res?.success) {
        toast.success(`Month ${currentMonth} reopened successfully with audit trail.`);
        setIsReopenModalOpen(false);
        setReopenReason('');
        fetchPeriodStatus();
        triggerRefresh();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reopen period');
    } finally {
      setReopening(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mess Configuration & Monthly Closing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure mess financial parameters and manage immutable monthly accounting closes
          </p>
        </div>

        {/* Section 1: Monthly Accounting Period Closing & Reopening */}
        <Card className={periodStatus === 'closed' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    periodStatus === 'closed'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {periodStatus === 'closed' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="text-sm">
                    Monthly Closing: {getMonthName(currentMonth)}
                  </CardTitle>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Controls whether records for {currentMonth} can be modified
                  </p>
                </div>
              </div>

              <div>
                <Badge variant={periodStatus === 'closed' ? 'warning' : 'success'} className="text-xs px-2.5 py-1">
                  {periodStatus === 'closed' ? '🔒 Period Finalized (Closed)' : '🔓 Period Active (Open)'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {periodStatus === 'closed' ? (
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Period is officially closed and finalized.</p>
                    <p className="text-2xs text-amber-800 mt-0.5">
                      Closed on: {formatDate(periodData?.closedAt)} • Final snapshot generated with exact member settlements preserved. Normal edits to daily meals, expenses, and deposits for {currentMonth} are locked.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Unlock}
                    onClick={() => setIsReopenModalOpen(true)}
                    className="border-amber-600 text-amber-800 hover:bg-amber-100"
                  >
                    Audited Reopen Month
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p>
                  Month <strong>{getMonthName(currentMonth)}</strong> is currently open for daily data entry. When all daily meals, bazar expenses, utility bills, and member deposits for this month have been reconciled, close the month to lock it against further changes and archive the immutable final snapshot.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Lock}
                    onClick={() => setIsCloseModalOpen(true)}
                  >
                    Finalize & Close Month ({currentMonth})
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Mess General Profile & Currency */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" /> Mess Profile & Currency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mess Name"
                  placeholder="Green View Bachelor Mess"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  required
                />
                <Input
                  label="Currency Symbol"
                  placeholder="৳"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Mess Physical Address"
                placeholder="House #42, Road #7, Dhanmondi, Dhaka"
                value={messAddress}
                onChange={(e) => setMessAddress(e.target.value)}
              />

              <div className="flex justify-end pt-2">
                <Button variant="primary" type="submit" isLoading={savingSettings} icon={Save}>
                  Save Mess Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 3: Manager Account Information */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Manager Account & Security Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold block">
                  Logged In Manager
                </span>
                <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
                <span className="text-2xs text-slate-500 block">{user?.email}</span>
              </div>
              <div>
                <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold block">
                  Security Privilege
                </span>
                <span className="font-bold text-emerald-700 uppercase">{user?.role} Access</span>
                <span className="text-2xs text-slate-500 block">HTTP-only cookie JWT session active</span>
              </div>
            </div>
            <p className="text-2xs text-slate-400">
              Passwords are encrypted using 12 salt rounds with bcrypt. To change manager credentials or add secondary managers, run the secure admin seeding script on the server.
            </p>
          </CardContent>
        </Card>

        {/* Close Month Modal */}
        {isCloseModalOpen && (
          <Modal
            isOpen={isCloseModalOpen}
            onClose={() => setIsCloseModalOpen(false)}
            title={`Finalize & Close Month: ${getMonthName(currentMonth)}`}
            description="Reconciles all member meal records, bazar expenses, and deposits into a final immutable snapshot."
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">Closing Checklist:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-2xs text-slate-600">
                  <li>Verify all bazar receipts and utility bills are logged</li>
                  <li>Confirm all member attendance and daily meals are entered</li>
                  <li>Check that member deposit slips are verified</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Closing Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. October reconciled cleanly. All members reviewed their balances."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsCloseModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCloseMonth} isLoading={closing} icon={Lock}>
                  Confirm & Lock Month
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reopen Month Modal */}
        {isReopenModalOpen && (
          <Modal
            isOpen={isReopenModalOpen}
            onClose={() => setIsReopenModalOpen(false)}
            title={`Audited Reopen: ${getMonthName(currentMonth)}`}
            description="Unlock a finalized month to make necessary financial corrections."
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ Reopening an accounting period unlocks meal and expense edits. An audit log will be created with your reason and timestamp.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reopening (Required, min 5 chars)
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Late electricity bill arrived / Need to adjust 2 missed meals"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsReopenModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleReopenMonth}
                  isLoading={reopening}
                  icon={Unlock}
                >
                  Confirm Reopen
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
