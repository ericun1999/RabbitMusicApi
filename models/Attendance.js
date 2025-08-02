const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');
const Class = require('./Class');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  class_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Class,
      key: 'id',
    },
  },
  attendance_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['present', 'absent', 'late']],
    },
  },
}, {
  tableName: 'attendance',
  timestamps: false,
});

Attendance.belongsTo(User, { foreignKey: 'student_id' });
Attendance.belongsTo(Class, { foreignKey: 'class_id' });
module.exports = Attendance;