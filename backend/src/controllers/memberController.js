const Member = require('../models/Member');
const MealEntry = require('../models/MealEntry');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Mess = require('../models/Mess');
const AuditLog = require('../models/AuditLog');
const { calculateMonthlySettlement } = require('../services/calculationService');

async function getMembers(req, res, next) {
  try {
    const { search, active } = req.query;
    const query = { messId: req.messId };

    if (active !== undefined && active !== '') {
      query.isActive = active === 'true';
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { phone: reg }, { roomNumber: reg }];
    }

    const members = await Member.find(query).sort({ isActive: -1, name: 1 });
    return res.status(200).json({ success: true, count: members.length, members });
  } catch (error) {
    next(error);
  }
}

async function createMember(req, res, next) {
  try {
    const { name, phone, email, joinDate, roomNumber, openingBalance, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required' });
    }

    const member = new Member({
      messId: req.messId,
      name: name.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      roomNumber: roomNumber?.trim(),
      openingBalance: Number(openingBalance) || 0,
      notes: notes?.trim(),
      isActive: true,
    });

    await member.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'MEMBER_CREATED',
      entityType: 'Member',
      entityId: member._id.toString(),
      details: { name: member.name, phone: member.phone },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      member,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, joinDate, roomNumber, openingBalance, notes } = req.body;

    const member = await Member.findOne({ _id: id, messId: req.messId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (name) member.name = name.trim();
    if (phone !== undefined) member.phone = phone.trim();
    if (email !== undefined) member.email = email.trim();
    if (joinDate) member.joinDate = new Date(joinDate);
    if (roomNumber !== undefined) member.roomNumber = roomNumber.trim();
    if (openingBalance !== undefined) member.openingBalance = Number(openingBalance) || 0;
    if (notes !== undefined) member.notes = notes.trim();

    await member.save();

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      member,
    });
  } catch (error) {
    next(error);
  }
}

async function toggleMemberStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { activate } = req.body; // true = activate, false = deactivate

    const member = await Member.findOne({ _id: id, messId: req.messId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const isActivating = activate !== undefined ? Boolean(activate) : !member.isActive;

    member.isActive = isActivating;
    if (!isActivating) {
      member.leaveDate = new Date();
    } else {
      member.leaveDate = null;
    }

    await member.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: isActivating ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED',
      entityType: 'Member',
      entityId: member._id.toString(),
      details: { memberName: member.name, isActive: member.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: `Member ${isActivating ? 'activated' : 'deactivated'} successfully. Historical records preserved.`,
      member,
    });
  } catch (error) {
    next(error);
  }
}

async function getMemberStatement(req, res, next) {
  try {
    const { id } = req.params;
    const { month } = req.query; // "YYYY-MM"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    const member = await Member.findOne({ _id: id, messId: req.messId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [mess, allMembers, mealEntries, expenses, payments] = await Promise.all([
      Mess.findById(req.messId),
      Member.find({ messId: req.messId }),
      MealEntry.find({ messId: req.messId, month }),
      Expense.find({ messId: req.messId, month }),
      Payment.find({ messId: req.messId, month, isReversed: false }),
    ]);

    const settlementReport = calculateMonthlySettlement({
      members: allMembers,
      mealEntries,
      expenses,
      payments,
      settings: mess.settings,
      month,
    });

    const memberSettlement = settlementReport.memberSettlements.find(
      (s) => s.memberId.toString() === member._id.toString()
    );

    // Filter individual member records
    const memberMeals = await MealEntry.find({
      messId: req.messId,
      memberId: member._id,
      month,
    }).sort({ date: 1 });

    const memberPayments = await Payment.find({
      messId: req.messId,
      memberId: member._id,
      month,
    }).sort({ date: -1 });

    const memberPersonalExpenses = await Expense.find({
      messId: req.messId,
      paidByMemberId: member._id,
      paymentSource: 'member_personal',
      month,
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      statement: {
        member,
        month,
        settlement: memberSettlement,
        summary: settlementReport.summary,
        meals: memberMeals,
        payments: memberPayments,
        personalExpenses: memberPersonalExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMembers,
  createMember,
  updateMember,
  toggleMemberStatus,
  getMemberStatement,
};
