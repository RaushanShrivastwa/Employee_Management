const mongoose = require('mongoose');
const { DEPARTMENTS, EMPLOYEE_STATUSES } = require('../constants');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department'
      }
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true
    },
    skills: {
      type: [String],
      default: []
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required']
    },
    status: {
      type: String,
      enum: Object.values(EMPLOYEE_STATUSES),
      default: EMPLOYEE_STATUSES.ACTIVE
    },
    leaveStart: {
      type: Date,
      default: null
    },
    leaveEnd: {
      type: Date,
      default: null
    },
    activeTaskCount: {
      type: Number,
      default: 0,
      min: [0, 'Active task count cannot be negative']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Additional Indexes
employeeSchema.index({ status: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ fullName: 'text' });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
