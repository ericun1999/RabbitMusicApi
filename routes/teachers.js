const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateTeacher, validate } = require('../middleware/validators');
const { Teacher } = require('../models');

const router = express.Router();

router.get('/teachers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const teachers = await Teacher.findAll({
      attributes: ['teacher_id', 'name', 'user_id'],
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers', details: error.message });
  }
});

router.post('/teachers', authenticateToken, validateTeacher, validate, async (req, res) => {
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

module.exports = router;