const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  student_paying: {
    type: DataTypes.DECIMAL(10,2),
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
  attended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  attended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
    type: DataTypes.DECIMAL(10,2),
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
TeacherAttendance.belongsTo(Attendance, { foreignKey: 'attendance_id' });
// Add these associations to your models
Attendance.hasMany(TeacherAttendance, { foreignKey: 'attendance_id' });
Attendance.hasMany(StudentAttendance, { foreignKey: 'attendance_id' });
TeacherAttendance.belongsTo(Teacher, { foreignKey: 'teacher_id' });

module.exports = {
  User,
  Student,
  Teacher,
  Lesson,
  LessonStudent,
  Attendance,
  StudentAttendance,
  TeacherAttendance,
  Payment,
  sequelize,
};