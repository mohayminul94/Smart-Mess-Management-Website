const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    leaveDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    openingBalance: {
      type: Number,
      default: 0, // Positive: member owes mess; Negative: mess owes member
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ messId: 1, name: 1 });
memberSchema.index({ messId: 1, isActive: 1 });

module.exports = mongoose.model('Member', memberSchema);
