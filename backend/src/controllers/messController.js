const Mess = require('../models/Mess');
const MonthlyPeriod = require('../models/MonthlyPeriod');
const AuditLog = require('../models/AuditLog');
const Member = require('../models/Member');
const MealEntry = require('../models/MealEntry');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { calculateMonthlySettlement } = require('../services/calculationService');

async function getMessSettings(req, res, next) {
  try {
    const mess = await Mess.findById(req.messId);
    if (!mess) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }
    return res.status(200).json({ success: true, mess });
  } catch (error) {
    next(error);
  }
}

async function updateMessSettings(req, res, next) {
  try {
    const { name, address, currency, currencySymbol, settings } = req.body;
    const mess = await Mess.findById(req.messId);
    if (!mess) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }

    if (name) mess.name = name.trim();
    if (address !== undefined) mess.address = address.trim();
    if (currency) mess.currency = currency.trim();
    if (currencySymbol) mess.currencySymbol = currencySymbol.trim();
    if (settings) {
      if (settings.mealCategories) mess.settings.mealCategories = settings.mealCategories;
      if (settings.fixedCostCategories) mess.settings.fixedCostCategories = settings.fixedCostCategories;
      if (settings.defaultFixedAllocation) mess.settings.defaultFixedAllocation = settings.defaultFixedAllocation;
      if (settings.roundingPolicy) mess.settings.roundingPolicy = settings.roundingPolicy;
    }

    await mess.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'SETTINGS_UPDATED',
      entityType: 'Mess',
      entityId: mess._id.toString(),
      details: { name: mess.name, settings: mess.settings },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Mess settings updated successfully',
      mess,
    });
  } catch (error) {
    next(error);
  }
}

async function getMonthlyPeriodStatus(req, res, next) {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    let period = await MonthlyPeriod.findOne({ messId: req.messId, month });
    if (!period) {
      return res.status(200).json({
        success: true,
        period: {
          month,
          status: 'open',
          closedAt: null,
          snapshot: null,
        },
      });
    }

    return res.status(200).json({ success: true, period });
  } catch (error) {
    next(error);
  }
}

async function closeMonthlyPeriod(req, res, next) {
  try {
    const { month, notes } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    let period = await MonthlyPeriod.findOne({ messId: req.messId, month });
    if (period && period.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Accounting period ${month} is already closed.`,
      });
    }

    // Retrieve database records to calculate snapshot
    const [mess, members, mealEntries, expenses, payments] = await Promise.all([
      Mess.findById(req.messId),
      Member.find({ messId: req.messId }),
      MealEntry.find({ messId: req.messId, month }),
      Expense.find({ messId: req.messId, month }),
      Payment.find({ messId: req.messId, month, isReversed: false }),
    ]);

    const snapshot = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments,
      settings: mess.settings,
      month,
    });

    if (!period) {
      period = new MonthlyPeriod({
        messId: req.messId,
        month,
      });
    }

    period.status = 'closed';
    period.closedAt = new Date();
    period.closedBy = req.user._id;
    period.snapshot = snapshot;
    if (notes) period.notes = notes;

    await period.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'MONTH_CLOSED',
      entityType: 'MonthlyPeriod',
      entityId: period._id.toString(),
      details: { month, snapshotSummary: snapshot.summary },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: `Month ${month} has been successfully closed and reconciled.`,
      period,
    });
  } catch (error) {
    next(error);
  }
}

async function reopenMonthlyPeriod(req, res, next) {
  try {
    const { month, reopenReason } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    if (!reopenReason || reopenReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A clear reason of at least 5 characters is required to reopen a closed month.',
      });
    }

    const period = await MonthlyPeriod.findOne({ messId: req.messId, month });
    if (!period || period.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: `Accounting period ${month} is not currently closed.`,
      });
    }

    period.status = 'open';
    period.reopenedAt = new Date();
    period.reopenedBy = req.user._id;
    period.reopenReason = reopenReason.trim();

    await period.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'MONTH_REOPENED',
      entityType: 'MonthlyPeriod',
      entityId: period._id.toString(),
      details: { month, reopenReason: reopenReason.trim() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: `Month ${month} has been reopened for editing.`,
      period,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMessSettings,
  updateMessSettings,
  getMonthlyPeriodStatus,
  closeMonthlyPeriod,
  reopenMonthlyPeriod,
};
