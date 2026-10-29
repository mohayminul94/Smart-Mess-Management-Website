const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'bazar',
  'groceries',
  'house_rent',
  'gas',
  'electricity',
  'water',
  'wifi',
  'cleaning',
  'other',
];

const expenseSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'],
      index: true,
    },
    month: {
      type: String, // "YYYY-MM"
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be formatted YYYY-MM'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: EXPENSE_CATEGORIES,
      default: 'bazar',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 250,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    paymentSource: {
      type: String,
      enum: ['mess_cash', 'member_personal'],
      default: 'mess_cash',
      required: true,
    },
    paidByMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ messId: 1, month: 1 });
expenseSchema.index({ messId: 1, category: 1 });

expenseSchema.pre('validate', function (next) {
  if (this.date && !this.month) {
    this.month = this.date.substring(0, 7);
  }
  // If paymentSource is mess_cash, ensure paidByMemberId is null
  if (this.paymentSource === 'mess_cash') {
    this.paidByMemberId = null;
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
