const mongoose = require('mongoose');

const messSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mess name is required'],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    currency: {
      type: String,
      default: 'BDT',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '৳',
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      mealCategories: {
        type: [String],
        default: ['bazar', 'groceries'],
      },
      fixedCostCategories: {
        type: [String],
        default: ['house_rent', 'gas', 'electricity', 'water', 'wifi', 'cleaning', 'other'],
      },
      defaultFixedAllocation: {
        type: String,
        enum: ['equal', 'active_days'],
        default: 'equal',
      },
      roundingPolicy: {
        type: String,
        enum: ['round_to_paisa', 'round_to_taka'],
        default: 'round_to_paisa',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Mess', messSchema);
