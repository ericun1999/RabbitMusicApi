const express = require('express');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const router = express.Router();

// 記錄出勤（僅限管理員或員工）
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: req.__('error.access_denied') });
  }
  try {
    const { student_id, class_id, attendance_date, status } = req.body;
    const attendance = await Attendance.create({ student_id, class_id, attendance_date, status });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: req.__('error.create_failed') });
  }
});

// 取得課程出勤記錄
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findAll({ where: { class_id: req.params.class_id } });
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: req.__('error.fetch_failed') });
  }
});

module.exports = router;