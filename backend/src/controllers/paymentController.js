const Payment = require('../models/Payment');
const MonthlyPeriod = require('../models/MonthlyPeriod');
const AuditLog = require('../models/AuditLog');
const Member = require('../models/Member');

async function checkMonthNotClosed(messId, month) {
  const period = await MonthlyPeriod.findOne({ messId, month, status: 'closed' });
  if (period) {
    throw new Error(
      `Cannot modify records for closed accounting period ${month}. The period must be explicitly reopened first.`
    );
  }
}

async function getPayments(req, res, next) {
  try {
    const { month, memberId, page = 1, limit = 50 } = req.query;
    const query = { messId: req.messId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query.month = month;
    }

    if (memberId) {
      query.memberId = memberId;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const [payments, total, period] = await Promise.all([
      Payment.find(query)
        .populate('memberId', 'name phone roomNumber')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
      month ? MonthlyPeriod.findOne({ messId: req.messId, month }) : null,
    ]);

    // Active deposits sum (excluding reversed)
    const validSum = await Payment.aggregate([
      { $match: { ...query, isReversed: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalDeposits: validSum[0]?.total || 0,
      isMonthClosed: period?.status === 'closed',
      payments,
    });
  } catch (error) {
    next(error);
  }
}

async function createPayment(req, res, next) {
  try {
    const { memberId, date, amount, paymentMethod, reference, notes } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member is required' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const month = date.substring(0, 7);

    try {
      await checkMonthNotClosed(req.messId, month);
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    const member = await Member.findOne({ _id: memberId, messId: req.messId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Check duplicate submission within 1 minute with identical member & amount & date
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingRecent = await Payment.findOne({
      messId: req.messId,
      memberId,
      amount: Number(amount),
      date,
      createdAt: { $gte: oneMinuteAgo },
    });
    if (existingRecent) {
      return res.status(409).json({
        success: false,
        message: 'A payment with identical member, date, and amount was just submitted. Please avoid duplicate submission.',
      });
    }

    const payment = new Payment({
      messId: req.messId,
      memberId,
      date,
      month,
      amount: Math.round(Number(amount) * 100) / 100,
      paymentMethod: paymentMethod || 'cash',
      reference: reference?.trim(),
      notes: notes?.trim(),
      recordedBy: req.user._id,
    });

    await payment.save();
    await payment.populate('memberId', 'name phone roomNumber');

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      details: {
        memberName: member.name,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        date: payment.date,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Deposit payment recorded successfully',
      payment,
    });
  } catch (error) {
    next(error);
  }
}

async function reversePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { reversalReason } = req.body;

    if (!reversalReason || reversalReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reversal reason of at least 5 characters.',
      });
    }

    const payment = await Payment.findOne({ _id: id, messId: req.messId }).populate(
      'memberId',
      'name'
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.isReversed) {
      return res.status(400).json({ success: false, message: 'This payment has already been reversed.' });
    }

    try {
      await checkMonthNotClosed(req.messId, payment.month);
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    payment.isReversed = true;
    payment.reversalReason = reversalReason.trim();
    payment.reversedAt = new Date();
    payment.reversedBy = req.user._id;

    await payment.save();

    await AuditLog.create({
      messId: req.messId,
      userId: req.user._id,
      action: 'PAYMENT_REVERSED',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      details: {
        memberName: payment.memberId?.name,
        amount: payment.amount,
        reason: reversalReason.trim(),
        date: payment.date,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Payment has been successfully reversed with audit trail preserved.',
      payment,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPayments,
  createPayment,
  reversePayment,
};
