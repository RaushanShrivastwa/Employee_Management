const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow frontend dev server and deployed origins
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Employee & Task Management API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch 404 & Central Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
