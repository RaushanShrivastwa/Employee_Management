const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const Employee = require('../src/models/Employee');
const Task = require('../src/models/Task');
const Counter = require('../src/models/Counter');
const { EMPLOYEE_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../src/constants');

let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await Employee.init();
  await Task.init();
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test.beforeEach(async () => {
  await Employee.deleteMany({});
  await Task.deleteMany({});
  await Counter.deleteMany({});
});

test.describe('Section 9: Business Rules & API Checklist', () => {
  test('Rule: Duplicate employeeId and duplicate email (case-insensitive) -> 409', async () => {
    // Create initial employee
    const res1 = await request(app).post('/api/employees').send({
      employeeId: 'EMP-100',
      fullName: 'John Doe',
      email: 'john.doe@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      skills: ['JS'],
      joiningDate: '2023-01-01',
      status: 'Active'
    });
    assert.equal(res1.status, 201);

    // Duplicate employeeId
    const res2 = await request(app).post('/api/employees').send({
      employeeId: 'EMP-100',
      fullName: 'Another Person',
      email: 'another@test.com',
      phone: '1234567890',
      department: 'QA',
      role: 'Tester',
      skills: ['QA'],
      joiningDate: '2023-01-01'
    });
    assert.equal(res2.status, 409);

    // Duplicate email with different casing
    const res3 = await request(app).post('/api/employees').send({
      employeeId: 'EMP-101',
      fullName: 'Another Person',
      email: 'JOHN.DOE@test.com',
      phone: '1234567890',
      department: 'QA',
      role: 'Tester',
      skills: ['QA'],
      joiningDate: '2023-01-01'
    });
    assert.equal(res3.status, 409);
  });

  test('Rule: Assign task to Inactive employee -> 400', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-200',
      fullName: 'Inactive User',
      email: 'inactive@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.INACTIVE
    });

    const res = await request(app).post('/api/tasks').send({
      title: 'Task for Inactive',
      assignedEmployee: emp._id.toString(),
      department: 'Development',
      priority: TASK_PRIORITIES.MEDIUM,
      startDate: '2026-11-01',
      dueDate: '2026-11-05'
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Inactive/i);
  });

  test('Rule: On Leave with start date on leave boundary -> 400; outside leave -> OK', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-201',
      fullName: 'On Leave User',
      email: 'leave@test.com',
      phone: '1234567890',
      department: 'Design',
      role: 'Designer',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ON_LEAVE,
      leaveStart: new Date('2026-11-10T00:00:00.000Z'),
      leaveEnd: new Date('2026-11-20T23:59:59.999Z')
    });

    // 1. Task starting inside leave window (e.g. 2026-11-15) -> 400
    const resInside = await request(app).post('/api/tasks').send({
      title: 'Task Inside Leave',
      assignedEmployee: emp._id.toString(),
      department: 'Design',
      priority: TASK_PRIORITIES.MEDIUM,
      startDate: '2026-11-15',
      dueDate: '2026-11-25'
    });
    assert.equal(resInside.status, 400);
    assert.match(resInside.body.message, /On Leave/i);

    // 2. Task starting outside leave window (e.g. 2026-11-25) -> 201 OK
    const resOutside = await request(app).post('/api/tasks').send({
      title: 'Task Outside Leave',
      assignedEmployee: emp._id.toString(),
      department: 'Design',
      priority: TASK_PRIORITIES.MEDIUM,
      startDate: '2026-11-25',
      dueDate: '2026-11-30'
    });
    assert.equal(resOutside.status, 201);
  });

  test('Rule: Due date before Start date -> 400', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-202',
      fullName: 'Active User',
      email: 'active@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const res = await request(app).post('/api/tasks').send({
      title: 'Backwards Date Task',
      assignedEmployee: emp._id.toString(),
      department: 'Development',
      startDate: '2026-11-10',
      dueDate: '2026-11-05' // Earlier than start date!
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /greater than or equal/i);
  });

  test('Rule: Capacity <= 3 and 4th active task blocked with 400', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-203',
      fullName: 'Busy Dev',
      email: 'busy@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 0
    });

    // Create 3 active tasks
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).post('/api/tasks').send({
        title: `Active Task ${i}`,
        assignedEmployee: emp._id.toString(),
        department: 'Development',
        startDate: '2026-11-01',
        dueDate: '2026-11-10'
      });
      assert.equal(res.status, 201);
    }

    // Check employee activeTaskCount is 3
    const empCheck = await Employee.findById(emp._id);
    assert.equal(empCheck.activeTaskCount, 3);

    // Attempting to create 4th active task -> 400
    const res4 = await request(app).post('/api/tasks').send({
      title: '4th Overflow Task',
      assignedEmployee: emp._id.toString(),
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });
    assert.equal(res4.status, 400);
    assert.match(res4.body.message, /maximum capacity of 3/i);
  });

  test('Rule: Concurrency - two parallel requests at an employee with 2 tasks: only one succeeds', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-204',
      fullName: 'Concurrent Dev',
      email: 'concurrent@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE,
      activeTaskCount: 2 // Already holds 2 active tasks
    });

    const taskPayload = (title) => ({
      title,
      assignedEmployee: emp._id.toString(),
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });

    // Fire 2 simultaneous requests
    const [resA, resB] = await Promise.all([
      request(app).post('/api/tasks').send(taskPayload('Race Task A')),
      request(app).post('/api/tasks').send(taskPayload('Race Task B'))
    ]);

    const statuses = [resA.status, resB.status];
    assert.ok(statuses.includes(201), 'One request should succeed');
    assert.ok(statuses.includes(400), 'One request should fail due to atomic capacity check');

    const updatedEmp = await Employee.findById(emp._id);
    assert.equal(updatedEmp.activeTaskCount, 3, 'Employee should have exactly 3 active tasks, never 4');
  });

  test('Rule: Status flow transitions and terminal states (Todo -> Completed is invalid)', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-205',
      fullName: 'Transition User',
      email: 'trans@test.com',
      phone: '1234567890',
      department: 'QA',
      role: 'QA',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const createRes = await request(app).post('/api/tasks').send({
      title: 'Workflow Task',
      assignedEmployee: emp._id.toString(),
      department: 'QA',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });
    const taskId = createRes.body.data._id;

    // 1. Invalid: Todo directly to Completed -> 400
    const invalidJump = await request(app).put(`/api/tasks/${taskId}/status`).send({
      status: 'Completed'
    });
    assert.equal(invalidJump.status, 400);

    // 2. Valid: Todo -> In Progress -> 200
    const toInProgress = await request(app).put(`/api/tasks/${taskId}/status`).send({
      status: 'In Progress'
    });
    assert.equal(toInProgress.status, 200);

    // 3. Valid: In Progress -> Completed -> 200
    const toCompleted = await request(app).put(`/api/tasks/${taskId}/status`).send({
      status: 'Completed'
    });
    assert.equal(toCompleted.status, 200);
    assert.ok(toCompleted.body.data.completedDate, 'completedDate should be populated by backend');

    // activeTaskCount should now be decremented back to 0
    const empAfterComplete = await Employee.findById(emp._id);
    assert.equal(empAfterComplete.activeTaskCount, 0);

    // 4. Invalid: Completed -> anything -> 400
    const fromTerminal = await request(app).put(`/api/tasks/${taskId}/status`).send({
      status: 'In Progress'
    });
    assert.equal(fromTerminal.status, 400);
  });

  test('Rule: PUT /api/tasks/:id with status or completedDate is rejected with 400', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-206',
      fullName: 'Put Test User',
      email: 'put@test.com',
      phone: '1234567890',
      department: 'HR',
      role: 'Recruiter',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const createRes = await request(app).post('/api/tasks').send({
      title: 'Normal Put Task',
      assignedEmployee: emp._id.toString(),
      department: 'HR',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });
    const taskId = createRes.body.data._id;

    const resWithStatus = await request(app).put(`/api/tasks/${taskId}`).send({
      status: 'Completed'
    });
    assert.equal(resWithStatus.status, 400);

    const resWithDate = await request(app).put(`/api/tasks/${taskId}`).send({
      completedDate: '2026-11-02'
    });
    assert.equal(resWithDate.status, 400);
  });

  test('Rule: Edit a Completed or Cancelled task -> 400', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-207',
      fullName: 'Terminal Edit User',
      email: 'term@test.com',
      phone: '1234567890',
      department: 'Sales',
      role: 'Sales',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const createRes = await request(app).post('/api/tasks').send({
      title: 'Cancelled Task',
      assignedEmployee: emp._id.toString(),
      department: 'Sales',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });
    const taskId = createRes.body.data._id;

    // Transition to Cancelled
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });

    // Attempt to edit description -> 400
    const editRes = await request(app).put(`/api/tasks/${taskId}`).send({
      description: 'New Description for cancelled task'
    });
    assert.equal(editRes.status, 400);
    assert.match(editRes.body.message, /terminal state/i);
  });

  test('Rule: Delete an employee with active tasks or assigned tasks is blocked -> 400; candidate without tasks -> OK', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-208',
      fullName: 'Deletion Subject',
      email: 'del@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Engineer',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const createRes = await request(app).post('/api/tasks').send({
      title: 'Active Task Pending',
      assignedEmployee: emp._id.toString(),
      department: 'Development',
      startDate: '2026-11-01',
      dueDate: '2026-11-10'
    });
    const taskId = createRes.body.data._id;

    // 1. Active task exists -> Deletion blocked with 400
    const deleteBlocked = await request(app).delete(`/api/employees/${emp._id}`);
    assert.equal(deleteBlocked.status, 400);
    assert.match(deleteBlocked.body.message, /active task|assigned task/i);

    // 2. Complete the task -> Employee still has assigned task in system -> Deletion still blocked with 400
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    const deleteWithCompletedTask = await request(app).delete(`/api/employees/${emp._id}`);
    assert.equal(deleteWithCompletedTask.status, 400);
    assert.match(deleteWithCompletedTask.body.message, /assigned task/i);

    // 3. Employee without any tasks can be safely deleted -> 200 OK
    const unassignedEmp = await Employee.create({
      employeeId: 'EMP-208B',
      fullName: 'No Task Candidate',
      email: 'notask@test.com',
      phone: '1234567890',
      department: 'QA',
      role: 'QA Engineer',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    const deleteUnassigned = await request(app).delete(`/api/employees/${unassignedEmp._id}`);
    assert.equal(deleteUnassigned.status, 200);

    // 4. Verify old task still has employeeSnapshot
    const taskAfter = await Task.findById(taskId);
    assert.equal(taskAfter.employeeSnapshot.fullName, 'Deletion Subject');
    assert.equal(taskAfter.employeeSnapshot.employeeId, 'EMP-208');
  });

  test('Rule: Combined filters, sorting, CSV export, and Overdue computation', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP-209',
      fullName: 'Metrics User',
      email: 'metrics@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Dev',
      joiningDate: new Date('2023-01-01'),
      status: EMPLOYEE_STATUSES.ACTIVE
    });

    // Create overdue task (due in past, Todo)
    await Task.create({
      taskId: 'TSK-901',
      title: 'Old Bug Fix',
      assignedEmployee: emp._id,
      employeeSnapshot: { employeeId: emp.employeeId, fullName: emp.fullName, email: emp.email },
      department: 'Development',
      priority: TASK_PRIORITIES.CRITICAL,
      priorityRank: 4,
      status: TASK_STATUSES.TODO,
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-05') // past
    });

    // Create non-overdue task
    await Task.create({
      taskId: 'TSK-902',
      title: 'Future Feature',
      assignedEmployee: emp._id,
      employeeSnapshot: { employeeId: emp.employeeId, fullName: emp.fullName, email: emp.email },
      department: 'Development',
      priority: TASK_PRIORITIES.LOW,
      priorityRank: 1,
      status: TASK_STATUSES.TODO,
      startDate: new Date('2026-11-01'),
      dueDate: new Date('2026-11-10') // future
    });

    // 1. Test isOverdue filter
    const overdueList = await request(app).get('/api/tasks?isOverdue=true');
    assert.equal(overdueList.status, 200);
    assert.equal(overdueList.body.data.length, 1);
    assert.equal(overdueList.body.data[0].taskId, 'TSK-901');

    // 2. Test Dashboard overdue count matches
    const dashRes = await request(app).get('/api/dashboard');
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.data.summary.overdueTasks, 1);

    // 3. Test CSV export matches query and has headers
    const csvRes = await request(app).get('/api/tasks/export/csv?department=Development');
    assert.equal(csvRes.status, 200);
    assert.equal(csvRes.headers['content-type'], 'text/csv; charset=utf-8');
    assert.match(csvRes.text, /"Task ID","Title","Description","Department","Priority","Status","Is Overdue"/);
    assert.match(csvRes.text, /TSK-901/);
    assert.match(csvRes.text, /TSK-902/);
  });
});
