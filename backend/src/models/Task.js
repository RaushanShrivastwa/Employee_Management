const mongoose = require('mongoose');
const {
  DEPARTMENTS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PRIORITY_RANKS,
  TRANSITIONS
} = require('../constants');
const { isOverdue } = require('../utils/dateHelpers');

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    employeeSnapshot: {
      employeeId: { type: String, default: null },
      fullName: { type: String, default: null },
      email: { type: String, default: null }
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department'
      }
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: Object.values(TASK_PRIORITIES),
        message: '{VALUE} is not a valid priority'
      },
      default: TASK_PRIORITIES.MEDIUM
    },
    priorityRank: {
      type: Number,
      default: PRIORITY_RANKS[TASK_PRIORITIES.MEDIUM]
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.TODO
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-validate hook to set priorityRank
taskSchema.pre('validate', function (next) {
  if (this.priority && PRIORITY_RANKS[this.priority]) {
    this.priorityRank = PRIORITY_RANKS[this.priority];
  }
  next();
});

// Dynamic Virtual: isOverdue (never persisted to MongoDB)
taskSchema.virtual('isOverdue').get(function () {
  return isOverdue(this);
});

// Dynamic Virtual: allowedNextStatuses
taskSchema.virtual('allowedNextStatuses').get(function () {
  return TRANSITIONS[this.status] || [];
});

// Indexes for high-frequency queries
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ department: 1 });
taskSchema.index({ priority: 1, priorityRank: -1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
