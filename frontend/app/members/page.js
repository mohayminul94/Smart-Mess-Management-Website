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
import AddMemberModal from '@/components/modals/AddMemberModal';
import MemberStatementModal from '@/components/modals/MemberStatementModal';
import { useMess } from '@/context/MessContext';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  FileText,
  Edit2,
  UserX,
  UserCheck,
  Phone,
  Calendar,
  Home,
} from 'lucide-react';

export default function MembersPage() {
  const { currentMonth, currencySymbol, refreshTrigger, triggerRefresh, openMemberModal } = useMess();

  const [members, setMembers] = useState([]);
  const [settlementsMap, setSettlementsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'true', 'false'

  // Edit / Statement modals
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Status toggle confirm
  const [memberToToggle, setMemberToToggle] = useState(null);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchMembersAndSettlement = useCallback(async () => {
    try {
      setLoading(true);
      let query = '';
      if (filterActive !== 'all') {
        query += `active=${filterActive}`;
      }
      if (search.trim()) {
        query += `${query ? '&' : ''}search=${encodeURIComponent(search.trim())}`;
      }

      const [membersRes, calcRes] = await Promise.all([
        api.get(`/members?${query}`),
        api.get(`/calculations/monthly?month=${currentMonth}`),
      ]);

      if (membersRes?.success) {
        setMembers(membersRes.members || []);
      }

      if (calcRes?.success && calcRes?.calculation?.memberSettlements) {
        const map = {};
        for (const s of calcRes.calculation.memberSettlements) {
          map[s.memberId.toString()] = s;
        }
        setSettlementsMap(map);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load member records');
    } finally {
      setLoading(false);
    }
  }, [filterActive, search, currentMonth]);

  useEffect(() => {
    fetchMembersAndSettlement();
  }, [fetchMembersAndSettlement, refreshTrigger]);

  const handleToggleStatus = async () => {
    if (!memberToToggle) return;
    try {
      setToggling(true);
      const res = await api.patch(`/members/${memberToToggle._id}/toggle-status`, {
        activate: !memberToToggle.isActive,
      });
      if (res?.success) {
        toast.success(res.message);
        triggerRefresh();
        setIsToggleConfirmOpen(false);
        setMemberToToggle(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update member status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Member Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage bachelor residents, room allocations, and individual account statuses
            </p>
          </div>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={openMemberModal}>
            Add New Member
          </Button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder="Search member by name, phone, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto self-end">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold mr-1">
              Status:
            </span>
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterActive === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setFilterActive('true')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterActive === 'true'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive('false')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterActive === 'false'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inactive / Left
            </button>
          </div>
        </div>

        {/* Member Table Card */}
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Mess Members List ({members.length})
            </CardTitle>
            <span className="text-2xs text-slate-400">
              Balances shown for: <strong>{getMonthName(currentMonth)}</strong>
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members found"
                description="Add members to start logging meals, expenses, and deposits."
                actionLabel="Add Member"
                onAction={openMemberModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="px-4 py-3">Member Details</th>
                      <th className="px-3 py-3">Room / Seat</th>
                      <th className="px-3 py-3">Joined</th>
                      <th className="px-3 py-3 text-center">Meals</th>
                      <th className="px-3 py-3 text-right">Total Cost</th>
                      <th className="px-3 py-3 text-right">Deposits</th>
                      <th className="px-4 py-3 text-right">Net Balance</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((member) => {
                      const s = settlementsMap[member._id.toString()];
                      return (
                        <tr key={member._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  member.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800">{member.name}</span>
                                  {!member.isActive && <Badge variant="inactive">Inactive</Badge>}
                                </div>
                                <p className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  {member.phone && (
                                    <>
                                      <Phone className="w-2.5 h-2.5" /> {member.phone}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-slate-600 font-medium">
                            {member.roomNumber ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-2xs">
                                <Home className="w-3 h-3 text-slate-500" /> Room {member.roomNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-slate-500 text-2xs">
                            {formatDate(member.joinDate)}
                          </td>

                          <td className="px-3 py-3 text-center font-bold text-slate-700">
                            {s ? s.totalMeals : 0}
                          </td>

                          <td className="px-3 py-3 text-right font-medium text-slate-800">
                            {s ? formatCurrency(s.totalCost, currencySymbol) : '-'}
                          </td>

                          <td className="px-3 py-3 text-right font-medium text-emerald-700">
                            {s ? formatCurrency(s.deposits, currencySymbol) : '-'}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {s ? (
                              <div>
                                <span
                                  className={`font-bold text-xs ${
                                    s.finalBalance > 0
                                      ? 'text-rose-600'
                                      : s.finalBalance < 0
                                      ? 'text-emerald-600'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {formatCurrency(Math.abs(s.finalBalance), currencySymbol)}
                                </span>
                                <Badge
                                  variant={
                                    s.status === 'Due'
                                      ? 'due'
                                      : s.status === 'Receivable'
                                      ? 'receivable'
                                      : 'settled'
                                  }
                                  className="ml-1.5 text-2xs"
                                >
                                  {s.status}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Monthly Statement */}
                              <button
                                onClick={() => {
                                  setSelectedMemberForStatement(member);
                                  setIsStatementModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="View Itemized Monthly Statement"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setSelectedMemberForEdit(member);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Edit Member Profile"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Deactivate / Reactivate (Preserves records) */}
                              <button
                                onClick={() => {
                                  setMemberToToggle(member);
                                  setIsToggleConfirmOpen(true);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  member.isActive
                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={
                                  member.isActive
                                    ? 'Deactivate Member (Preserves history)'
                                    : 'Reactivate Member'
                                }
                              >
                                {member.isActive ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Member Modal */}
        {selectedMemberForEdit && (
          <AddMemberModal
            memberToEdit={selectedMemberForEdit}
            isOpenOverride={isEditModalOpen}
            onCloseOverride={() => {
              setIsEditModalOpen(false);
              setSelectedMemberForEdit(null);
            }}
          />
        )}

        {/* Member Statement Modal */}
        {selectedMemberForStatement && (
          <MemberStatementModal
            memberId={selectedMemberForStatement._id}
            month={currentMonth}
            isOpen={isStatementModalOpen}
            onClose={() => {
              setIsStatementModalOpen(false);
              setSelectedMemberForStatement(null);
            }}
          />
        )}

        {/* Soft Deactivate / Reactivate Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isToggleConfirmOpen}
          onClose={() => {
            setIsToggleConfirmOpen(false);
            setMemberToToggle(null);
          }}
          onConfirm={handleToggleStatus}
          title={
            memberToToggle?.isActive
              ? `Deactivate ${memberToToggle?.name}?`
              : `Reactivate ${memberToToggle?.name}?`
          }
          message={
            memberToToggle?.isActive
              ? `Deactivating this member will stop future fixed costs allocation while permanently preserving all past meal history, payments, and financial settlement records.`
              : `Reactivating will mark this member as active and eligible for daily meals and monthly fixed utility allocations.`
          }
          confirmLabel={memberToToggle?.isActive ? 'Deactivate Member' : 'Reactivate'}
          isDanger={memberToToggle?.isActive}
          isLoading={toggling}
        />
      </div>
    </AppLayout>
  );
}
