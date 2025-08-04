const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

router.get('/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const users = await User.findAll({
      attributes: ['user_id', 'username', 'role'],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

module.exports = router;