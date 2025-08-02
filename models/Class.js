const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schedule: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  staff_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  tableName: 'classes',
  timestamps: false,
});

Class.belongsTo(User, { foreignKey: 'staff_id' });
module.exports = Class;