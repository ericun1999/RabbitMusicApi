const express = require('express');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const router = express.Router();

// 新增課程（僅限管理員）
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: req.__('error.access_denied') });
  try {
    const { name, schedule, staff_id } = req.body;
    const classObj = await Class.create({ name, schedule, staff_id });
    res.status(201).json(classObj);
  } catch (error) {
    res.status(400).json({ error: req.__('error.create_failed') });
  }
});

// 取得所有課程
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.findAll({ include: [{ model: require('../models/User'), as: 'User' }] });
    res.json(classes);
  } catch (error) {
    res.status(400).json({ error: req.__('error.fetch_failed') });
  }
});

module.exports = router;