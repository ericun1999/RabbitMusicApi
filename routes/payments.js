const express = require('express');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const router = express.Router();

// 記錄付款
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: req.__('error.access_denied') });
  }
  try {
    const { student_id, amount, payment_method, status, note } = req.body;
    const payment = await Payment.create({ student_id, amount, payment_method, status, note });
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: req.__('error.create_failed') });
  }
});

// 取得學生付款記錄
router.get('/student/:student_id', auth, async (req, res) => {
  try {
    const payments = await Payment.findAll({ where: { student_id: req.params.student_id } });
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: req.__('error.fetch_failed') });
  }
});

module.exports = router;