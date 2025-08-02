const express = require('express');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const router = express.Router();

// 註冊學生到課程（僅限管理員或員工）
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: req.__('error.access_denied') });
  }
  try {
    const { student_id, class_id } = req.body;
    const enrollment = await Enrollment.create({ student_id, class_id });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: req.__('error.create_failed') });
  }
});

// 取得課程的註冊記錄
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({ where: { class_id: req.params.class_id } });
    res.json(enrollments);
  } catch (error) {
    res.status(400).json({ error: req.__('error.fetch_failed') });
  }
});

module.exports = router;