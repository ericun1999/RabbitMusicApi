const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Sequelize setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Define models
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'Users',
  timestamps: false,
});

const Student = sequelize.define('Student', {
  student_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'Students',
  timestamps: false,
});

const Teacher = sequelize.define('Teacher', {
  teacher_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'Teachers',
  timestamps: false,
});

const Lesson = sequelize.define('Lesson', {
  lesson_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  usual_time: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  teacher_earning: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  student_paying: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'Lessons',
  timestamps: false,
});

const LessonStudent = sequelize.define('LessonStudent', {
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  tableName: 'Lesson_Students',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'lesson_id'],
    },
  ],
});

const Attendance = sequelize.define('Attendance', {
  attendance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  lesson_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'Attendance',
  timestamps: false,
});

const StudentAttendance = sequelize.define('StudentAttendance', {
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  tableName: 'Student_Attendance',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'attendance_id'],
    },
  ],
});

const TeacherAttendance = sequelize.define('TeacherAttendance', {
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  teacher_earning: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  tableName: 'Teacher_Attendance',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['teacher_id', 'attendance_id'],
    },
  ],
});

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  payment_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lessons_included: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'Payment',
  timestamps: false,
});

// Define relationships
Student.belongsTo(User, { foreignKey: 'user_id' });
Teacher.belongsTo(User, { foreignKey: 'user_id' });
Lesson.belongsTo(Teacher, { foreignKey: 'teacher_id' });
Payment.belongsTo(Student, { foreignKey: 'student_id' });
Payment.belongsTo(Lesson, { foreignKey: 'lesson_id' });
LessonStudent.belongsTo(Lesson, { foreignKey: 'lesson_id' });
LessonStudent.belongsTo(Student, { foreignKey: 'student_id' });
Attendance.belongsTo(Lesson, { foreignKey: 'lesson_id' });
StudentAttendance.belongsTo(Student, { foreignKey: 'student_id' });
StudentAttendance.belongsTo(Attendance, { foreignKey: 'attendance_id' });
TeacherAttendance.belongsTo(Teacher, { foreignKey: 'teacher_id' });
TeacherAttendance.belongsTo(Attendance, { foreignKey: 'attendance_id' });

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Input validation middleware
const validateUser = [
  body('username').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  body('role').isIn(['student', 'teacher', 'admin']),
];

const validateStudent = [
  body('name').isString().trim().notEmpty(),
  body('phone').isString().trim().notEmpty(),
];

const validateTeacher = [
  body('name').isString().trim().notEmpty(),
  body('phone').isString().trim().notEmpty(),
];

const validateLesson = [
  body('name').isString().trim().notEmpty(),
  body('usual_time').isString().trim().notEmpty(),
  body('teacher_id').isInt(),
  body('teacher_earning').isInt({ min: 0 }),
  body('student_paying').isInt({ min: 0 }),
];

const validatePayment = [
  body('amount').isInt({ min: 0 }),
  body('lessons_included').isInt({ min: 1 }),
  body('lesson_id').isInt(),
];

const validateLessonStudent = [
  body('student_id').isInt(),
  body('lesson_id').isInt(),
];

const validateAttendance = [
  body('lesson_time').isISO8601().toDate(),
  body('lesson_id').isInt(),
];

const validateStudentAttendance = [
  body('student_id').isInt(),
  body('attendance_id').isInt(),
];

const validateTeacherAttendance = [
  body('teacher_id').isInt(),
  body('teacher_earning').isInt({ min: 0 }),
  body('attendance_id').isInt(),
];

const validateLessonId = [
  param('lesson_id').isInt().withMessage('Lesson ID must be an integer'),
];

// Error handling for validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Authentication endpoints
app.post('/api/register', validateUser, validate, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ user_id: user.user_id });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Student endpoints
app.post('/api/students', authenticateToken, validateStudent, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { user_id, name, phone } = req.body;
    const student = await Student.create({ user_id, name, phone });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student', details: error.message });
  }
});

// Teacher endpoints
app.post('/api/teachers', authenticateToken, validateTeacher, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { user_id, name, phone } = req.body;
    const teacher = await Teacher.create({ user_id, name, phone });
    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create teacher', details: error.message });
  }
});

// Lesson endpoints
app.post('/api/lessons', authenticateToken, validateLesson, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { name, usual_time, teacher_id, teacher_earning, student_paying } = req.body;
    const lesson = await Lesson.create({
      name,
      usual_time,
      teacher_id,
      teacher_earning,
      student_paying,
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lesson', details: error.message });
  }
});

// Payment endpoints
app.post('/api/payments', authenticateToken, validatePayment, validate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student or admin access required' });
  }

  try {
    const { student_id, amount, lessons_included, lesson_id } = req.body;
    const payment = await Payment.create({
      payment_time: new Date(),
      student_id,
      amount,
      lessons_included,
      lesson_id,
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// Lesson-Student assignment
app.post('/api/lesson-students', authenticateToken, validateLessonStudent, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, lesson_id } = req.body;
    const lessonStudent = await LessonStudent.create({
      student_id,
      lesson_id,
    });
    res.status(201).json(lessonStudent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign student to lesson', details: error.message });
  }
});

// Attendance endpoints
app.post('/api/attendance', authenticateToken, validateAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { lesson_time, lesson_id } = req.body;
    const attendance = await Attendance.create({
      lesson_time,
      lesson_id,
    });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create attendance', details: error.message });
  }
});

// Student-Attendance endpoints
app.post('/api/student-attendance', authenticateToken, validateStudentAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, attendance_id } = req.body;
    const studentAttendance = await StudentAttendance.create({
      student_id,
      attendance_id,
    });
    res.status(201).json(studentAttendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student attendance', details: error.message });
  }
});

// Teacher-Attendance endpoints
app.post('/api/teacher-attendance', authenticateToken, validateTeacherAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { teacher_id, teacher_earning, attendance_id } = req.body;
    const teacherAttendance = await TeacherAttendance.create({
      teacher_id,
      teacher_earning,
      attendance_id,
    });
    res.status(201).json(teacherAttendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create teacher attendance', details: error.message });
  }
});

// Teacher Salaries endpoint
app.get('/api/teacher-salaries', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const [results] = await sequelize.query(`
      SELECT 
          t.teacher_id,
          t.name AS teacher_name,
          COALESCE(SUM(ta.teacher_earning), 0) AS total_salary
      FROM 
          "Teachers" t
      LEFT JOIN 
          "Teacher_Attendance" ta ON t.teacher_id = ta.teacher_id
      LEFT JOIN 
          "Attendance" a ON ta.attendance_id = a.attendance_id
      WHERE 
          a.lesson_time >= CURRENT_DATE - INTERVAL '2 months'
          AND a.lesson_time <= CURRENT_DATE
      GROUP BY 
          t.teacher_id, t.name
      ORDER BY 
          t.teacher_id
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher salaries', details: error.message });
  }
});

// Student Remaining Lessons endpoint
app.get('/api/student-remaining-lessons/:lesson_id', authenticateToken, validateLessonId, validate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student or admin access required' });
  }

  try {
    const lessonId = req.params.lesson_id;
    const [results] = await sequelize.query(`
      SELECT 
          s.student_id,
          s.name AS student_name,
          COALESCE(SUM(p.lessons_included), 0) - COALESCE(COUNT(sa.attendance_id), 0) AS remaining_lessons
      FROM 
          "Students" s
      INNER JOIN 
          "Lesson_Students" ls ON s.student_id = ls.student_id
      LEFT JOIN 
          "Payment" p ON s.student_id = p.student_id AND p.lesson_id = :lesson_id
      LEFT JOIN 
          "Student_Attendance" sa ON s.student_id = sa.student_id
      LEFT JOIN 
          "Attendance" a ON sa.attendance_id = a.attendance_id AND a.lesson_id = :lesson_id
      WHERE 
          ls.lesson_id = :lesson_id
      GROUP BY 
          s.student_id, s.name
      ORDER BY 
          s.student_id
    `, {
      replacements: { lesson_id: lessonId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.user_id } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      const studentResult = results.find(r => r.student_id === student.student_id);
      return res.json(studentResult ? [studentResult] : []);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch remaining lessons', details: error.message });
  }
});

// Profit Past Month endpoint
app.get('/api/profit-past-month', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const [results] = await sequelize.query(`
      SELECT 
          COALESCE(SUM(p.amount), 0) AS total_revenue,
          COALESCE(SUM(ta.teacher_earning), 0) AS total_teacher_salaries,
          COALESCE(SUM(p.amount), 0) - COALESCE(SUM(ta.teacher_earning), 0) AS profit
      FROM 
          "Payment" p
      FULL OUTER JOIN 
          "Teacher_Attendance" ta ON TRUE
      LEFT JOIN 
          "Attendance" a ON ta.attendance_id = a.attendance_id
      WHERE 
          (p.payment_time >= CURRENT_DATE - INTERVAL '1 month' 
           AND p.payment_time <= CURRENT_DATE)
          OR 
          (a.lesson_time >= CURRENT_DATE - INTERVAL '1 month' 
           AND a.lesson_time <= CURRENT_DATE)
          OR 
          (p.payment_time IS NULL AND a.lesson_time IS NULL)
    `);
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profit', details: error.message });
  }
});

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