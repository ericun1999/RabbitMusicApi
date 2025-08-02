const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');
const Class = require('./Class');

const Enrollment = sequelize.define('Enrollment', {
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
}, {
  tableName: 'enrollments',
  timestamps: false,
});

Enrollment.belongsTo(User, { foreignKey: 'student_id' });
Enrollment.belongsTo(Class, { foreignKey: 'class_id' });
module.exports = Enrollment;