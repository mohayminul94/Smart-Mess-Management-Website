const Expense = require('../models/Expense');
const MonthlyPeriod = require('../models/MonthlyPeriod');
const AuditLog = require('../models/AuditLog');

async function checkMonthNotClosed(messId, month) {
  const period = await MonthlyPeriod.findOne({ messId, month, status: 'closed' });
  if (period) {
    throw new Error(
      `Cannot modify records for closed accounting period ${month}. The period must be explicitly reopened first.`
    );
  }
}

async function getExpenses(req, res, next) {
  try {
    const { month, category, search, page = 1, limit = 50 } = req.query;
    const query = { messId: req.messId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query.month = month;
    }

    if (category) {
      query.category = category;
    }

    if (search && search.trim()) {
      query.description = new RegExp(search.trim(), 'i');
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const [expenses, total, period] = await Promise.all([
      Expense.find(query)
        .populate('paidByMemberId', 'name phone')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(query),
      month ? MonthlyPeriod.findOne({ messId: req.messId, month }) : null,
    ]);

    // Calculate sum of returned matching query
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalAmount: totalAmount[0]?.total || 0,
      isMonthClosed: period?.status === 'closed',
      expenses,
    });
  } catch (error) {
    next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const {
      date,
      category,
      amount,
      description,
      receiptUrl,
      paymentSource = 'mess_cash',
      paidByMemberId,
    } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    if (paymentSource === 'member_personal' && !paidByMemberId) {
      return res.status(400).json({
        success: false,
        message: 'Must specify which member paid when payment source is member personal',
      });
    }

    const month = date.substring(0, 7);

    try {
      await checkMonthNotClosed(req.messId, month);
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    const expense = new Expense({
      messId: req.messId,
      date,
      month,
      category: category || 'bazar',
      amount: Math.round(Number(amount) * 100) / 100,
      description: description.trim(),
      receiptUrl: receiptUrl ? receiptUrl.trim() : undefined,
      paymentSource,
      paidByMemberId: paymentSource === 'member_personal' ? paidByMemberId : null,
      recordedBy: req.user._id,
    });

    await expense.save();
    await expense.populate('paidByMemberId', 'name phone');

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;
    const {
      date,
      category,
      amount,
      description,
      receiptUrl,
      paymentSource,
      paidByMemberId,
    } = req.body;

    const expense = await Expense.findOne({ _id: id, messId: req.messId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const targetMonth = (date ? date.substring(0, 7) : expense.month);

    try {
      await checkMonthNotClosed(req.messId, expense.month);
      if (targetMonth !== expense.month) {
        await checkMonthNotClosed(req.messId, targetMonth);
      }
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    if (date) {
      expense.date = date;
      expense.month = date.substring(0, 7);
    }
    if (category) expense.category = category;
    if (amount) expense.amount = Math.round(Number(amount) * 100) / 100;
    if (description !== undefined) expense.description = description.trim();
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl.trim();
    if (paymentSource) {
      expense.paymentSource = paymentSource;
      expense.paidByMemberId = paymentSource === 'member_personal' ? paidByMemberId : null;
    } else if (paidByMemberId !== undefined) {
      expense.paidByMemberId = paidByMemberId;
    }

    await expense.save();
    await expense.populate('paidByMemberId', 'name phone');

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({ _id: id, messId: req.messId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    try {
      await checkMonthNotClosed(req.messId, expense.month);
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    await Expense.deleteOne({ _id: id });

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'EXPENSE_DELETED',
      entityType: 'Expense',
      entityId: id,
      details: {
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
