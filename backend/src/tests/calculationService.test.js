const assert = require('assert');
const {
  toPaisa,
  fromPaisa,
  distributePaisaEqually,
  isMemberEligibleForMonth,
  calculateMonthlySettlement,
} = require('../services/calculationService');

function runAllTests() {
  console.log('🧪 Starting Calculation Engine Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Test 1: toPaisa & fromPaisa
  test('Paisa conversion avoids floating point imprecision', () => {
    assert.strictEqual(toPaisa(12.34), 1234);
    assert.strictEqual(toPaisa(0.1 + 0.2), 30);
    assert.strictEqual(fromPaisa(1234), 12.34);
    assert.strictEqual(fromPaisa(30), 0.3);
  });

  // Test 2: distributePaisaEqually deterministic reconciliation
  test('distributePaisaEqually reconciles remainder exactly with zero loss', () => {
    // 1000.01 BDT = 100001 paisa across 3 members
    const totalPaisa = 100001;
    const shares = distributePaisaEqually(totalPaisa, 3);
    assert.strictEqual(shares.length, 3);
    assert.strictEqual(shares[0], 33334);
    assert.strictEqual(shares[1], 33334);
    assert.strictEqual(shares[2], 33333);
    const sum = shares.reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, totalPaisa, 'Sum of shares must equal total paisa exactly');
  });

  // Test 3: Zero meals safe division
  test('Zero meals with zero expenses produces rate 0 and no error', () => {
    const result = calculateMonthlySettlement({
      members: [{ _id: 'm1', name: 'Member 1', isActive: true }],
      mealEntries: [],
      expenses: [],
      payments: [],
      month: '2026-10',
    });
    assert.strictEqual(result.summary.mealRate, 0);
    assert.strictEqual(result.summary.totalMeals, 0);
    assert.strictEqual(result.summary.hasZeroMealsWarning, false);
    assert.strictEqual(result.memberSettlements[0].status, 'Settled');
  });

  // Test 4: Zero meals with bazar expense triggers warning without NaN/crash
  test('Zero meals with bazar expense flags zero-meals warning and safe rate', () => {
    const result = calculateMonthlySettlement({
      members: [{ _id: 'm1', name: 'Member 1', isActive: true }],
      mealEntries: [],
      expenses: [{ category: 'bazar', amount: 500 }],
      payments: [],
      month: '2026-10',
    });
    assert.strictEqual(result.summary.mealRate, 0);
    assert.strictEqual(result.summary.hasZeroMealsWarning, true);
    assert.strictEqual(result.summary.totalBazarExpense, 500);
  });

  // Test 5: Fractional meals calculation & meal rate
  test('Fractional meals (e.g. 0.5, 1.5) calculate meal rate accurately', () => {
    const members = [
      { _id: 'm1', name: 'Rahim', isActive: true },
      { _id: 'm2', name: 'Karim', isActive: true },
    ];
    // Total meals: Rahim (2.5), Karim (3.5) = 6.0 meals
    const mealEntries = [
      { memberId: 'm1', breakfast: 0.5, lunch: 1, dinner: 1 },
      { memberId: 'm2', breakfast: 1, lunch: 1.5, dinner: 1 },
    ];
    // Bazar expense: 360 BDT. Meal rate = 360 / 6 = 60 BDT
    const expenses = [{ category: 'bazar', amount: 360, paymentSource: 'mess_cash' }];

    const result = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments: [],
      month: '2026-10',
    });

    assert.strictEqual(result.summary.totalMeals, 6);
    assert.strictEqual(result.summary.mealRate, 60);

    const rahim = result.memberSettlements.find((s) => s.memberId === 'm1');
    const karim = result.memberSettlements.find((s) => s.memberId === 'm2');

    // Rahim meal cost = 2.5 * 60 = 150 BDT
    assert.strictEqual(rahim.mealCost, 150);
    // Karim meal cost = 3.5 * 60 = 210 BDT
    assert.strictEqual(karim.mealCost, 210);
  });

  // Test 6: Member personal expense payment credit
  test('Personal expense payment by member is credited exactly once in settlement', () => {
    const members = [
      { _id: 'm1', name: 'Rahim', isActive: true },
      { _id: 'm2', name: 'Karim', isActive: true },
    ];
    const mealEntries = [
      { memberId: 'm1', breakfast: 1, lunch: 1, dinner: 1 }, // 3 meals
      { memberId: 'm2', breakfast: 1, lunch: 1, dinner: 1 }, // 3 meals
    ];
    // Rahim personally paid 600 BDT for bazar from his pocket
    const expenses = [
      {
        category: 'bazar',
        amount: 600,
        paymentSource: 'member_personal',
        paidByMemberId: 'm1',
      },
    ];

    const result = calculateMonthlySettlement({
      members,
      mealEntries,
      expenses,
      payments: [],
      month: '2026-10',
    });

    assert.strictEqual(result.summary.mealRate, 100); // 600 / 6 = 100
    const rahim = result.memberSettlements.find((s) => s.memberId === 'm1');
    const karim = result.memberSettlements.find((s) => s.memberId === 'm2');

    // Rahim cost = 300, Personal paid = 600 => Balance = 300 - 600 = -300 (Mess owes Rahim 300)
    assert.strictEqual(rahim.personalExpensePayments, 600);
    assert.strictEqual(rahim.finalBalance, -300);
    assert.strictEqual(rahim.status, 'Receivable');

    // Karim cost = 300, Personal paid = 0 => Balance = 300 (Karim owes mess 300)
    assert.strictEqual(karim.finalBalance, 300);
    assert.strictEqual(karim.status, 'Due');
  });

  // Test 7: Fixed cost equal distribution and sign convention
  test('Fixed costs distribute equally and settlement balances reconcile', () => {
    const members = [
      { _id: 'm1', name: 'M1', isActive: true, openingBalance: 100 }, // owes 100 from past
      { _id: 'm2', name: 'M2', isActive: true, openingBalance: -50 }, // mess owes 50 from past
    ];
    // Fixed cost: wifi 1000 BDT (shared 500 each)
    const expenses = [
      { category: 'wifi', amount: 1000, paymentSource: 'mess_cash' },
    ];
    // M1 deposited 400 BDT, M2 deposited 500 BDT
    const payments = [
      { memberId: 'm1', amount: 400 },
      { memberId: 'm2', amount: 500 },
    ];

    const result = calculateMonthlySettlement({
      members,
      mealEntries: [],
      expenses,
      payments,
      month: '2026-10',
    });

    const m1 = result.memberSettlements.find((s) => s.memberId === 'm1');
    const m2 = result.memberSettlements.find((s) => s.memberId === 'm2');

    // M1: Cost 500 - Deposit 400 + Opening Debt 100 = 200 Due
    assert.strictEqual(m1.fixedCostShare, 500);
    assert.strictEqual(m1.finalBalance, 200);
    assert.strictEqual(m1.status, 'Due');

    // M2: Cost 500 - Deposit 500 + Opening Credit (-50) = -50 Receivable
    assert.strictEqual(m2.fixedCostShare, 500);
    assert.strictEqual(m2.finalBalance, -50);
    assert.strictEqual(m2.status, 'Receivable');
  });

  // Test 8: Member eligibility based on join and leave dates
  test('Member eligibility correctly respects join and leave dates', () => {
    // Member joined next month
    assert.strictEqual(
      isMemberEligibleForMonth({ joinDate: '2026-11-05' }, '2026-10'),
      false
    );
    // Member left before this month
    assert.strictEqual(
      isMemberEligibleForMonth(
        { joinDate: '2026-01-01', leaveDate: '2026-09-28' },
        '2026-10'
      ),
      false
    );
    // Active member in this month
    assert.strictEqual(
      isMemberEligibleForMonth(
        { joinDate: '2026-08-01', leaveDate: null, isActive: true },
        '2026-10'
      ),
      true
    );
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
