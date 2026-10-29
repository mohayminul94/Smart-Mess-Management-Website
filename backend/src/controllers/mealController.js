const MealEntry = require('../models/MealEntry');
const Member = require('../models/Member');
const MonthlyPeriod = require('../models/MonthlyPeriod');

async function checkMonthNotClosed(messId, month) {
  const period = await MonthlyPeriod.findOne({ messId, month, status: 'closed' });
  if (period) {
    throw new Error(
      `Cannot modify records for closed accounting period ${month}. The period must be explicitly reopened first.`
    );
  }
}

async function getMealsByDate(req, res, next) {
  try {
    const { date } = req.query; // "YYYY-MM-DD"
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    const month = date.substring(0, 7);

    // Fetch all active members plus any inactive member who has meals on this date
    const [allMembers, existingMeals, period] = await Promise.all([
      Member.find({ messId: req.messId }).sort({ name: 1 }),
      MealEntry.find({ messId: req.messId, date }),
      MonthlyPeriod.findOne({ messId: req.messId, month }),
    ]);

    const mealsMap = {};
    for (const m of existingMeals) {
      mealsMap[m.memberId.toString()] = m;
    }

    // Merge members with meals
    const rows = allMembers
      .filter((member) => member.isActive || mealsMap[member._id.toString()])
      .map((member) => {
        const meal = mealsMap[member._id.toString()];
        return {
          memberId: member._id,
          memberName: member.name,
          roomNumber: member.roomNumber || '',
          isActive: member.isActive,
          breakfast: meal ? meal.breakfast : 0,
          lunch: meal ? meal.lunch : 0,
          dinner: meal ? meal.dinner : 0,
          totalMeals: meal ? meal.totalMeals : 0,
          notes: meal ? meal.notes || '' : '',
          mealEntryId: meal ? meal._id : null,
        };
      });

    const dayTotals = rows.reduce(
      (acc, r) => {
        acc.breakfast += r.breakfast;
        acc.lunch += r.lunch;
        acc.dinner += r.dinner;
        acc.total += r.totalMeals;
        return acc;
      },
      { breakfast: 0, lunch: 0, dinner: 0, total: 0 }
    );

    return res.status(200).json({
      success: true,
      date,
      month,
      isMonthClosed: period?.status === 'closed',
      totals: {
        breakfast: Math.round(dayTotals.breakfast * 100) / 100,
        lunch: Math.round(dayTotals.lunch * 100) / 100,
        dinner: Math.round(dayTotals.dinner * 100) / 100,
        totalMeals: Math.round(dayTotals.total * 100) / 100,
      },
      entries: rows,
    });
  } catch (error) {
    next(error);
  }
}

async function saveBulkMeals(req, res, next) {
  try {
    const { date, entries } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array is required' });
    }

    const month = date.substring(0, 7);

    // Verify month is not closed
    try {
      await checkMonthNotClosed(req.messId, month);
    } catch (closedErr) {
      return res.status(403).json({ success: false, message: closedErr.message });
    }

    const operations = [];

    for (const item of entries) {
      if (!item.memberId) continue;

      const breakfast = Math.max(0, Number(item.breakfast) || 0);
      const lunch = Math.max(0, Number(item.lunch) || 0);
      const dinner = Math.max(0, Number(item.dinner) || 0);
      const totalMeals = Math.round((breakfast + lunch + dinner) * 100) / 100;

      // Upsert into MealEntry
      operations.push(
        MealEntry.findOneAndUpdate(
          {
            messId: req.messId,
            memberId: item.memberId,
            date,
          },
          {
            messId: req.messId,
            memberId: item.memberId,
            date,
            month,
            breakfast,
            lunch,
            dinner,
            totalMeals,
            recordedBy: req.user._id,
            notes: item.notes ? item.notes.trim() : undefined,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        )
      );
    }

    await Promise.all(operations);

    return res.status(200).json({
      success: true,
      message: `Meals for ${date} saved successfully.`,
      date,
      count: operations.length,
    });
  } catch (error) {
    next(error);
  }
}

async function getMonthlyMealSummary(req, res, next) {
  try {
    const { month } = req.query; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    const [members, entries] = await Promise.all([
      Member.find({ messId: req.messId }).sort({ name: 1 }),
      MealEntry.find({ messId: req.messId, month }),
    ]);

    // Group meals by date for trend chart
    const dailyMap = {};
    for (const e of entries) {
      if (!dailyMap[e.date]) {
        dailyMap[e.date] = { date: e.date, breakfast: 0, lunch: 0, dinner: 0, total: 0 };
      }
      dailyMap[e.date].breakfast += e.breakfast;
      dailyMap[e.date].lunch += e.lunch;
      dailyMap[e.date].dinner += e.dinner;
      dailyMap[e.date].total += e.totalMeals;
    }

    const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Group meals by member
    const memberMap = {};
    for (const m of members) {
      memberMap[m._id.toString()] = {
        memberId: m._id,
        name: m.name,
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        total: 0,
      };
    }

    for (const e of entries) {
      const mKey = e.memberId.toString();
      if (memberMap[mKey]) {
        memberMap[mKey].breakfast += e.breakfast;
        memberMap[mKey].lunch += e.lunch;
        memberMap[mKey].dinner += e.dinner;
        memberMap[mKey].total += e.totalMeals;
      }
    }

    return res.status(200).json({
      success: true,
      month,
      dailyTrends,
      memberSummaries: Object.values(memberMap),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMealsByDate,
  saveBulkMeals,
  getMonthlyMealSummary,
};
