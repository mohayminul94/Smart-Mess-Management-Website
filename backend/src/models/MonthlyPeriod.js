const mongoose = require('mongoose');

const monthlyPeriodSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    month: {
      type: String, // "YYYY-MM"
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be formatted YYYY-MM'],
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reopenedAt: {
      type: Date,
    },
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reopenReason: {
      type: String,
      trim: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

monthlyPeriodSchema.index({ messId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyPeriod', monthlyPeriodSchema);
