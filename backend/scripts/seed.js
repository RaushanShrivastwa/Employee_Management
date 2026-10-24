const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const Employee = require('../src/models/Employee');
const Task = require('../src/models/Task');
const Counter = require('../src/models/Counter');
const { DEPARTMENTS, EMPLOYEE_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../src/constants');

const seedData = async (isStandalone = true) => {
  if (isStandalone) {
    await connectDB();
  }
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    Employee.deleteMany({}),
    Task.deleteMany({}),
    Counter.deleteMany({})
  ]);

  console.log('[Seed] Inserting Employees...');
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const employees = await Employee.create([
    {
      employeeId: 'EMP-001',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@rootsmedia.com',
      phone: '+91-9876543210',
      department: 'Development',
      role: 'Senior Full Stack Engineer',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker'],
      joiningDate: new Date('2023-01-15'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 2
    },
    {
      employeeId: 'EMP-002',
      fullName: 'Diya Patel',
      email: 'diya.patel@rootsmedia.com',
      phone: '+91-9876543211',
      department: 'Design',
      role: 'Lead UI/UX Designer',
      skills: ['Figma', 'Design Systems', 'Wireframing', 'Prototyping'],
      joiningDate: new Date('2023-03-10'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 2
    },
    {
      employeeId: 'EMP-003',
      fullName: 'Rohan Verma',
      email: 'rohan.verma@rootsmedia.com',
      phone: '+91-9876543212',
      department: 'QA',
      role: 'QA Automation Engineer',
      skills: ['Cypress', 'Jest', 'API Testing', 'Selenium'],
      joiningDate: new Date('2023-06-01'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 1
    },
    {
      employeeId: 'EMP-004',
      fullName: 'Pooja Nair',
      email: 'pooja.nair@rootsmedia.com',
      phone: '+91-9876543213',
      department: 'HR',
      role: 'HR Business Partner',
      skills: ['Talent Acquisition', 'Employee Relations', 'HRIS'],
      joiningDate: new Date('2022-11-20'),
      status: EMPLOYEE_STATUSES.ON_LEAVE,
      leaveStart: nextWeek,
      leaveEnd: twoWeeksLater,
      activeTaskCount: 0
    },
    {
      employeeId: 'EMP-005',
      fullName: 'Vikram Malhotra',
      email: 'vikram.malhotra@rootsmedia.com',
      phone: '+91-9876543214',
      department: 'Sales',
      role: 'Enterprise Account Executive',
      skills: ['B2B Sales', 'CRM', 'Lead Generation', 'Negotiation'],
      joiningDate: new Date('2024-02-01'),
      status: EMPLOYEE_STATUSES.INACTIVE,
      activeTaskCount: 0
    },
    {
      employeeId: 'EMP-006',
      fullName: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@rootsmedia.com',
      phone: '+91-9876543215',
      department: 'Development',
      role: 'Frontend Specialist',
      skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux'],
      joiningDate: new Date('2024-05-12'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 1
    }
  ]);

  console.log('[Seed] Setting up Counter and Tasks...');
  await Counter.create({ _id: 'taskId', seq: 6 });

  const pastDate3Days = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastDate1Day = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
  const futureDate4Days = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
  const futureDate10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

  const tasksData = [
    {
      taskId: 'TSK-001',
      title: 'Implement MongoDB Transaction Fallback',
      description: 'Ensure atomic capacity verification when handling concurrent assignments',
      assignedEmployee: employees[0]._id,
      employeeSnapshot: {
        employeeId: employees[0].employeeId,
        fullName: employees[0].fullName,
        email: employees[0].email
      },
      department: 'Development',
      priority: TASK_PRIORITIES.CRITICAL,
      status: TASK_STATUSES.IN_PROGRESS,
      startDate: new Date('2026-10-15'),
      dueDate: futureDate4Days
    },
    {
      taskId: 'TSK-002',
      title: 'Upgrade Design Tokens and UI Component Library',
      description: 'Refactor Tailwind color palette and accessibility contrast ratios',
      assignedEmployee: employees[1]._id,
      employeeSnapshot: {
        employeeId: employees[1].employeeId,
        fullName: employees[1].fullName,
        email: employees[1].email
      },
      department: 'Design',
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.IN_PROGRESS,
      startDate: new Date('2026-10-10'),
      dueDate: pastDate1Day // OVERDUE (due date is yesterday, status is In Progress)
    },
    {
      taskId: 'TSK-003',
      title: 'Setup Cypress E2E Test Suite for Workflows',
      description: 'Automate verification of status transitions and edge case limits',
      assignedEmployee: employees[2]._id,
      employeeSnapshot: {
        employeeId: employees[2].employeeId,
        fullName: employees[2].fullName,
        email: employees[2].email
      },
      department: 'QA',
      priority: TASK_PRIORITIES.MEDIUM,
      status: TASK_STATUSES.TODO,
      startDate: new Date('2026-10-18'),
      dueDate: pastDate3Days // OVERDUE (due date is 3 days ago, status is Todo)
    },
    {
      taskId: 'TSK-004',
      title: 'Optimize REST Query Pagination and CSV Streaming',
      description: 'Stream large result sets directly with proper formula injection escaping',
      assignedEmployee: employees[0]._id,
      employeeSnapshot: {
        employeeId: employees[0].employeeId,
        fullName: employees[0].fullName,
        email: employees[0].email
      },
      department: 'Development',
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.TODO,
      startDate: new Date('2026-10-20'),
      dueDate: futureDate10Days
    },
    {
      taskId: 'TSK-005',
      title: 'Design Mobile Responsive Navigation Drawer',
      description: 'Create slide-over drawer navigation for mobile viewport displays',
      assignedEmployee: employees[1]._id,
      employeeSnapshot: {
        employeeId: employees[1].employeeId,
        fullName: employees[1].fullName,
        email: employees[1].email
      },
      department: 'Design',
      priority: TASK_PRIORITIES.LOW,
      status: TASK_STATUSES.TODO,
      startDate: new Date('2026-10-21'),
      dueDate: futureDate4Days
    },
    {
      taskId: 'TSK-006',
      title: 'Build Reusable Toast Notification System',
      description: 'Integrate toast notifications for status updates and error responses',
      assignedEmployee: employees[5]._id,
      employeeSnapshot: {
        employeeId: employees[5].employeeId,
        fullName: employees[5].fullName,
        email: employees[5].email
      },
      department: 'Development',
      priority: TASK_PRIORITIES.MEDIUM,
      status: TASK_STATUSES.COMPLETED,
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-08'),
      completedDate: new Date('2026-10-07')
    }
  ];

  await Task.create(tasksData);
  console.log(`[Seed] Seeded ${employees.length} employees and ${tasksData.length} tasks successfully.`);
  if (isStandalone) {
    await disconnectDB();
    process.exit(0);
  }
};

if (require.main === module) {
  seedData(true).catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });
}

module.exports = { seedData };
