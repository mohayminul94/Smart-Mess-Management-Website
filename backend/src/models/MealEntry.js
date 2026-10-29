const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema(
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
    breakfast: {
      type: Number,
      default: 0,
      min: 0,
    },
    lunch: {
      type: Number,
      default: 0,
      min: 0,
    },
    dinner: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMeals: {
      type: Number,
      default: 0,
      min: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Enforce unique daily meal entry per member within the mess
mealEntrySchema.index({ messId: 1, memberId: 1, date: 1 }, { unique: true });
mealEntrySchema.index({ messId: 1, month: 1 });

mealEntrySchema.pre('validate', function (next) {
  if (this.date && !this.month) {
    this.month = this.date.substring(0, 7);
  }
  this.breakfast = Math.max(0, Number(this.breakfast) || 0);
  this.lunch = Math.max(0, Number(this.lunch) || 0);
  this.dinner = Math.max(0, Number(this.dinner) || 0);
  this.totalMeals = Math.round((this.breakfast + this.lunch + this.dinner) * 100) / 100;
  next();
});

module.exports = mongoose.model('MealEntry', mealEntrySchema);
