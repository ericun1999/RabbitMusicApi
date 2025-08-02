const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' },
  },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  payment_method: { type: DataTypes.STRING },
  status: {
    type: DataTypes.STRING,
    validate: { isIn: [['pending', 'completed', 'failed']] },
  },
  note: { type: DataTypes.TEXT },
}, { tableName: 'payments', timestamps: false });

Payment.belongsTo(User, { foreignKey: 'student_id' });
module.exports = Payment;