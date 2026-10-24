const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { versionKey: false }
);

/**
 * Atomically increments counter and returns formatted sequence string (e.g. TSK-001)
 */
counterSchema.statics.getNextSequence = async function (counterName, prefix = 'TSK-', padLength = 3) {
  const counter = await this.findByIdAndUpdate(
    counterName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formattedNumber = String(counter.seq).padStart(padLength, '0');
  return `${prefix}${formattedNumber}`;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
