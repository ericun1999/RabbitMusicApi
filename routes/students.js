const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateStudent, validate } = require('../middleware/validators');
const { Student } = require('../models');

const router = express.Router();

router.get('/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const students = await Student.findAll({
      attributes: ['student_id', 'name'],
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students', details: error.message });
  }
});

router.post('/students', authenticateToken, validateStudent, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { user_id, name, phone } = req.body;
    const student = await Student.create({ user_id, name, phone });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student', details: error.message });
  }
});

module.exports = router;