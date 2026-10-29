const mongoose = require('mongoose');

const PAYMENT_METHODS = ['cash', 'bKash', 'nagad', 'rocket', 'bank_transfer', 'other'];

const paymentSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
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
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cash',
      required: true,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isReversed: {
      type: Boolean,
      default: false,
      index: true,
    },
    reversalReason: {
      type: String,
      trim: true,
    },
    reversedAt: {
      type: Date,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

paymentSchema.index({ messId: 1, month: 1 });
paymentSchema.index({ messId: 1, memberId: 1 });

paymentSchema.pre('validate', function (next) {
  if (this.date && !this.month) {
    this.month = this.date.substring(0, 7);
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
