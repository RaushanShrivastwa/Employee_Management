const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT } = require('./config/env');
const Employee = require('./models/Employee');
const { seedData } = require('../scripts/seed');

const startServer = async () => {
  try {
    await connectDB();

    const employeeCount = await Employee.countDocuments();
    if (employeeCount === 0) {
      console.log('🌱 Database is empty. Seeding realistic sample employees and tasks...');
      await seedData(false);
    }

    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Employees API: http://localhost:${PORT}/api/employees`);
      console.log(`📋 Tasks API:     http://localhost:${PORT}/api/tasks`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
      console.log(`=========================================`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
};

startServer();
