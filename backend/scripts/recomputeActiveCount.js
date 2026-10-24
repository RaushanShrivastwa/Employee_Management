const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const Employee = require('../src/models/Employee');
const Task = require('../src/models/Task');
const { ACTIVE_TASK_STATUSES } = require('../src/constants');

const recompute = async () => {
  await connectDB();
  console.log('[Recompute] Synchronizing employee activeTaskCount counters with active tasks in DB...');

  const employees = await Employee.find({});
  let updatedCount = 0;

  for (const emp of employees) {
    const actualActiveCount = await Task.countDocuments({
      assignedEmployee: emp._id,
      status: { $in: ACTIVE_TASK_STATUSES }
    });

    if (emp.activeTaskCount !== actualActiveCount) {
      console.log(`- Employee ${emp.employeeId} (${emp.fullName}): was ${emp.activeTaskCount}, correcting to ${actualActiveCount}`);
      emp.activeTaskCount = actualActiveCount;
      await emp.save();
      updatedCount++;
    }
  }

  console.log(`[Recompute] Completed. Corrected ${updatedCount} employee records.`);
  await disconnectDB();
  process.exit(0);
};

recompute().catch(err => {
  console.error('Error during recompute:', err);
  process.exit(1);
});
