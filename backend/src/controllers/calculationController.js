const Mess = require('../models/Mess');
const Member = require('../models/Member');
const MealEntry = require('../models/MealEntry');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const MonthlyPeriod = require('../models/MonthlyPeriod');
const { calculateMonthlySettlement } = require('../services/calculationService');

async function getMonthlyCalculations(req, res, next) {
  try {
    const { month } = req.query; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    const [mess, members, mealEntries, expenses, payments, period] = await Promise.all([
      Mess.findById(req.messId),
      Member.find({ messId: req.messId }),
      MealEntry.find({ messId: req.messId, month }),
      Expense.find({ messId: req.messId, month }),
      Payment.find({ messId: req.messId, month, isReversed: false }),
      MonthlyPeriod.findOne({ messId: req.messId, month }),
    ]);

    // If month is closed and has snapshot, we include the snapshot info
    const calculation = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments,
      settings: mess.settings,
      month,
    });

    return res.status(200).json({
      success: true,
      month,
      periodStatus: period?.status || 'open',
      closedAt: period?.closedAt || null,
      snapshot: period?.snapshot || null,
      calculation,
    });
  } catch (error) {
    next(error);
  }
}

async function getDashboardData(req, res, next) {
  try {
    const { month } = req.query; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    const [mess, members, mealEntries, expenses, payments, period] = await Promise.all([
      Mess.findById(req.messId),
      Member.find({ messId: req.messId }),
      MealEntry.find({ messId: req.messId, month }),
      Expense.find({ messId: req.messId, month }),
      Payment.find({ messId: req.messId, month, isReversed: false }),
      MonthlyPeriod.findOne({ messId: req.messId, month }),
    ]);

    const calculation = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments,
      settings: mess.settings,
      month,
    });

    // 1. Daily Meal Trend (date -> total meals)
    const mealTrendMap = {};
    for (const e of mealEntries) {
      mealTrendMap[e.date] = (mealTrendMap[e.date] || 0) + e.totalMeals;
    }
    const dailyMealTrend = Object.keys(mealTrendMap)
      .sort()
      .map((date) => ({
        date: date.substring(8), // day of month
        fullDate: date,
        meals: Math.round(mealTrendMap[date] * 100) / 100,
      }));

    // 2. Daily Expense Trend
    const expenseTrendMap = {};
    for (const exp of expenses) {
      expenseTrendMap[exp.date] = (expenseTrendMap[exp.date] || 0) + exp.amount;
    }
    const dailyExpenseTrend = Object.keys(expenseTrendMap)
      .sort()
      .map((date) => ({
        date: date.substring(8),
        fullDate: date,
        amount: Math.round(expenseTrendMap[date] * 100) / 100,
      }));

    // 3. Category Breakdown for Charts
    const expenseCategoryList = Object.entries(calculation.categoryBreakdown).map(
      ([category, amount]) => ({
        name: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        rawCategory: category,
        value: amount,
      })
    );

    // 4. Recent Transactions (last 5 expenses + last 5 payments)
    const [recentExpenses, recentPayments] = await Promise.all([
      Expense.find({ messId: req.messId, month })
        .populate('paidByMemberId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(5),
      Payment.find({ messId: req.messId, month })
        .populate('memberId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(5),
    ]);

    // 5. Members with outstanding balances (highest due first)
    const membersWithDue = calculation.memberSettlements
      .filter((m) => m.finalBalance > 0)
      .sort((a, b) => b.finalBalance - a.finalBalance);

    return res.status(200).json({
      success: true,
      month,
      periodStatus: period?.status || 'open',
      stats: {
        totalBazarExpense: calculation.summary.totalBazarExpense,
        totalFixedExpense: calculation.summary.totalFixedExpense,
        totalExpenses: calculation.summary.totalExpenses,
        totalMeals: calculation.summary.totalMeals,
        mealRate: calculation.summary.mealRate,
        totalDeposits: calculation.summary.totalDeposits,
        totalPersonalExpensePayments: calculation.summary.totalPersonalExpensePayments,
        totalDue: calculation.summary.totalDue,
        totalReceivable: calculation.summary.totalReceivable,
        activeMembersCount: calculation.summary.activeMembersCount,
        hasZeroMealsWarning: calculation.summary.hasZeroMealsWarning,
        currencySymbol: mess?.currencySymbol || '৳',
      },
      charts: {
        dailyMealTrend,
        dailyExpenseTrend,
        expenseCategoryList,
      },
      recentExpenses,
      recentPayments,
      membersWithDue,
    });
  } catch (error) {
    next(error);
  }
}

async function getMonthlyReports(req, res, next) {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    const [mess, members, mealEntries, expenses, payments, period] = await Promise.all([
      Mess.findById(req.messId),
      Member.find({ messId: req.messId }),
      MealEntry.find({ messId: req.messId, month }),
      Expense.find({ messId: req.messId, month }).populate('paidByMemberId', 'name'),
      Payment.find({ messId: req.messId, month }).populate('memberId', 'name'),
      MonthlyPeriod.findOne({ messId: req.messId, month }),
    ]);

    const calculation = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments,
      settings: mess.settings,
      month,
    });

    return res.status(200).json({
      success: true,
      month,
      messName: mess.name,
      currencySymbol: mess.currencySymbol,
      periodStatus: period?.status || 'open',
      summary: calculation.summary,
      memberSettlements: calculation.memberSettlements,
      expenses,
      payments,
      categoryBreakdown: calculation.categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMonthlyCalculations,
  getDashboardData,
  getReports,
};
