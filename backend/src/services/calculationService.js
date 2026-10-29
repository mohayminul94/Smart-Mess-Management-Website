/**
 * Automatic Calculation Engine for Smart Mess Management System
 * 
 * Rules:
 * 1. Meal-cost pool = expenses with categories in mealCategories (default: ['bazar', 'groceries'])
 * 2. Fixed-cost pool = expenses with categories in fixedCostCategories (rent, gas, electricity, water, wifi, cleaning, other)
 * 3. Meal Rate = Total Meal Expenses / Total Meals (Paisa-accurate, safe division)
 * 4. Member Meal Cost = Member Total Meals * Meal Rate
 * 5. Fixed-cost distribution = Shared among eligible members with exact integer-paisa remainder reconciliation
 * 6. Member Balance = Total Cost - Deposits - Personal Expense Payments + Opening Balance
 *    Sign convention:
 *    - Positive (> 0): Member owes mess ("Due")
 *    - Negative (< 0): Mess owes member ("Receivable" / Advance)
 *    - Zero (0): Settled
 */

/**
 * Convert BDT to integer Paisa (1 BDT = 100 Paisa) to avoid IEEE-754 floating point errors
 */
function toPaisa(amount) {
  return Math.round(Number(amount || 0) * 100);
}

/**
 * Convert integer Paisa back to BDT rounded to 2 decimal places
 */
function fromPaisa(paisa) {
  return Math.round(paisa) / 100;
}

/**
 * Distribute an integer paisa amount across N entities deterministically,
 * preserving exact sum equality (sum(shares) === totalPaisa).
 */
function distributePaisaEqually(totalPaisa, count) {
  if (count <= 0) return [];
  const baseShare = Math.floor(totalPaisa / count);
  const remainder = totalPaisa % count; // remainder in [0, count-1]

  const shares = new Array(count).fill(baseShare);
  for (let i = 0; i < remainder; i++) {
    shares[i] += 1;
  }
  return shares;
}

/**
 * Check if a member is eligible for monthly fixed costs in a given month "YYYY-MM"
 */
function isMemberEligibleForMonth(member, monthStr) {
  if (!member) return false;
  
  const [year, month] = monthStr.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const joinDate = member.joinDate ? new Date(member.joinDate) : new Date(0);
  if (joinDate > monthEnd) {
    return false; // Joined in a future month
  }

  if (member.leaveDate) {
    const leaveDate = new Date(member.leaveDate);
    if (leaveDate < monthStart) {
      return false; // Left before this month started
    }
  }

  // If member is explicitly deactivated without leaveDate, consider active status
  if (member.isActive === false && !member.leaveDate && joinDate < monthStart) {
    // If they were deactivated before this month, not eligible
    return false;
  }

  return true;
}

/**
 * Pure calculation function taking raw data arrays and mess settings
 *
 * @param {Object} params
 * @param {Array} params.members - Array of member objects
 * @param {Array} params.mealEntries - Array of meal entries for the month
 * @param {Array} params.expenses - Array of expense records for the month
 * @param {Array} params.payments - Array of payment records for the month (non-reversed)
 * @param {Object} params.settings - Mess settings (mealCategories, fixedCostCategories)
 * @param {String} params.month - "YYYY-MM"
 * @returns {Object} Comprehensive calculation report
 */
function calculateMonthlySettlement({
  members = [],
  mealEntries = [],
  expenses = [],
  payments = [],
  settings = {},
  month = '',
}) {
  const mealCategories = settings.mealCategories || ['bazar', 'groceries'];
  const fixedCategories = settings.fixedCostCategories || [
    'house_rent',
    'gas',
    'electricity',
    'water',
    'wifi',
    'cleaning',
    'other',
  ];

  // 1. Process Expenses
  let totalBazarPaisa = 0;
  let totalFixedPaisa = 0;
  let totalOtherPaisa = 0;
  const categoryTotalsPaisa = {};
  const personalPaymentsByMember = {}; // memberId -> paisa paid personally for mess expenses

  for (const exp of expenses) {
    const amountPaisa = toPaisa(exp.amount);
    const cat = exp.category || 'other';

    categoryTotalsPaisa[cat] = (categoryTotalsPaisa[cat] || 0) + amountPaisa;

    if (mealCategories.includes(cat)) {
      totalBazarPaisa += amountPaisa;
    } else if (fixedCategories.includes(cat)) {
      totalFixedPaisa += amountPaisa;
    } else {
      totalOtherPaisa += amountPaisa;
    }

    // Track personal payment credit
    if (exp.paymentSource === 'member_personal' && exp.paidByMemberId) {
      const memberKey = exp.paidByMemberId.toString();
      personalPaymentsByMember[memberKey] = (personalPaymentsByMember[memberKey] || 0) + amountPaisa;
    }
  }

  const totalExpensePaisa = totalBazarPaisa + totalFixedPaisa + totalOtherPaisa;

  // 2. Process Meals
  let totalBreakfast = 0;
  let totalLunch = 0;
  let totalDinner = 0;
  const memberMeals = {}; // memberId -> { breakfast, lunch, dinner, totalMeals }

  for (const entry of mealEntries) {
    const memberKey = entry.memberId ? entry.memberId.toString() : null;
    if (!memberKey) continue;

    if (!memberMeals[memberKey]) {
      memberMeals[memberKey] = {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        totalMeals: 0,
      };
    }

    const b = Number(entry.breakfast || 0);
    const l = Number(entry.lunch || 0);
    const d = Number(entry.dinner || 0);
    const sum = b + l + d;

    memberMeals[memberKey].breakfast += b;
    memberMeals[memberKey].lunch += l;
    memberMeals[memberKey].dinner += d;
    memberMeals[memberKey].totalMeals += sum;

    totalBreakfast += b;
    totalLunch += l;
    totalDinner += d;
  }

  const grandTotalMeals = Math.round((totalBreakfast + totalLunch + totalDinner) * 100) / 100;

  // 3. Calculate Meal Rate (Safe Division)
  let mealRate = 0;
  let hasZeroMealsWarning = false;

  if (grandTotalMeals > 0) {
    // Meal Rate in BDT per meal = (totalBazar / grandTotalMeals)
    mealRate = Math.round((fromPaisa(totalBazarPaisa) / grandTotalMeals) * 10000) / 10000;
  } else if (totalBazarPaisa > 0) {
    // Bazar expense exists but no meals recorded!
    hasZeroMealsWarning = true;
    mealRate = 0;
  }

  // 4. Eligible Members for Fixed Costs
  // Deterministic order by ID for consistent remainder distribution
  const sortedMembers = [...members].sort((a, b) => {
    const idA = a._id ? a._id.toString() : '';
    const idB = b._id ? b._id.toString() : '';
    return idA.localeCompare(idB);
  });

  const eligibleMembers = sortedMembers.filter((m) =>
    month ? isMemberEligibleForMonth(m, month) : m.isActive !== false
  );

  const eligibleCount = eligibleMembers.length;
  const fixedSharesPaisa = distributePaisaEqually(totalFixedPaisa + totalOtherPaisa, eligibleCount);

  const memberFixedMap = {};
  eligibleMembers.forEach((m, idx) => {
    memberFixedMap[m._id.toString()] = fixedSharesPaisa[idx];
  });

  // 5. Process Payments / Deposits
  const memberDepositsPaisa = {};
  let totalDepositsPaisa = 0;

  for (const pay of payments) {
    if (pay.isReversed) continue;
    const memberKey = pay.memberId ? pay.memberId.toString() : null;
    if (!memberKey) continue;

    const amtPaisa = toPaisa(pay.amount);
    memberDepositsPaisa[memberKey] = (memberDepositsPaisa[memberKey] || 0) + amtPaisa;
    totalDepositsPaisa += amtPaisa;
  }

  // 6. Calculate Member-Wise Settlements
  let totalCalculatedMealCostPaisa = 0;
  let totalDuePaisa = 0;
  let totalReceivablePaisa = 0;

  const memberSettlements = sortedMembers.map((member) => {
    const memberKey = member._id.toString();
    const meals = memberMeals[memberKey] || {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      totalMeals: 0,
    };

    // Member meal cost in paisa
    const memberMealCostBDT = meals.totalMeals * mealRate;
    const memberMealCostPaisa = toPaisa(memberMealCostBDT);
    totalCalculatedMealCostPaisa += memberMealCostPaisa;

    // Member fixed cost share in paisa
    const memberFixedSharePaisa = memberFixedMap[memberKey] || 0;

    // Member total cost
    const memberTotalCostPaisa = memberMealCostPaisa + memberFixedSharePaisa;

    // Deposits & Credits
    const memberDepositPaisa = memberDepositsPaisa[memberKey] || 0;
    const personalPaymentPaisa = personalPaymentsByMember[memberKey] || 0;
    const openingBalancePaisa = toPaisa(member.openingBalance || 0);

    // Final balance calculation:
    // Positive balance = Member owes Mess (Due)
    // Negative balance = Mess owes Member (Receivable / Advance)
    const finalBalancePaisa =
      memberTotalCostPaisa - memberDepositPaisa - personalPaymentPaisa + openingBalancePaisa;
    const finalBalanceBDT = fromPaisa(finalBalancePaisa);

    let status = 'Settled';
    if (finalBalancePaisa > 0) {
      status = 'Due';
      totalDuePaisa += finalBalancePaisa;
    } else if (finalBalancePaisa < 0) {
      status = 'Receivable';
      totalReceivablePaisa += Math.abs(finalBalancePaisa);
    }

    return {
      memberId: member._id,
      memberName: member.name,
      phone: member.phone || '',
      roomNumber: member.roomNumber || '',
      isActive: member.isActive,
      isEligibleForFixed: Boolean(memberFixedMap[memberKey] !== undefined),
      breakfast: meals.breakfast,
      lunch: meals.lunch,
      dinner: meals.dinner,
      totalMeals: Math.round(meals.totalMeals * 100) / 100,
      mealRate: mealRate,
      mealCost: fromPaisa(memberMealCostPaisa),
      fixedCostShare: fromPaisa(memberFixedSharePaisa),
      totalCost: fromPaisa(memberTotalCostPaisa),
      deposits: fromPaisa(memberDepositPaisa),
      personalExpensePayments: fromPaisa(personalPaymentPaisa),
      openingBalance: fromPaisa(openingBalancePaisa),
      finalBalance: finalBalanceBDT,
      status: status,
    };
  });

  // Category breakdown in standard BDT
  const categoryBreakdown = {};
  for (const [cat, paisa] of Object.entries(categoryTotalsPaisa)) {
    categoryBreakdown[cat] = fromPaisa(paisa);
  }

  return {
    month,
    summary: {
      totalBazarExpense: fromPaisa(totalBazarPaisa),
      totalFixedExpense: fromPaisa(totalFixedPaisa + totalOtherPaisa),
      totalExpenses: fromPaisa(totalExpensePaisa),
      totalBreakfast,
      totalLunch,
      totalDinner,
      totalMeals: grandTotalMeals,
      mealRate,
      totalDeposits: fromPaisa(totalDepositsPaisa),
      totalPersonalExpensePayments: fromPaisa(
        Object.values(personalPaymentsByMember).reduce((a, b) => a + b, 0)
      ),
      totalDue: fromPaisa(totalDuePaisa),
      totalReceivable: fromPaisa(totalReceivablePaisa),
      activeMembersCount: members.filter((m) => m.isActive).length,
      eligibleMembersCount: eligibleCount,
      hasZeroMealsWarning,
    },
    categoryBreakdown,
    memberSettlements,
  };
}

module.exports = {
  toPaisa,
  fromPaisa,
  distributePaisaEqually,
  isMemberEligibleForMonth,
  calculateMonthlySettlement,
};
