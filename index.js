const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const lessonRoutes = require('./routes/lessons');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const { sequelize } = require('./config/database');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', studentRoutes);
app.use('/api', teacherRoutes);
app.use('/api', lessonRoutes);
app.use('/api', paymentRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', reportRoutes);

// Test database connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

// Sync database and start server
sequelize.sync({ force: false }).then(() => {
  console.log('兔子音樂資料庫同步完成');
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((error) => {
  console.error('Unable to sync database:', error);
});