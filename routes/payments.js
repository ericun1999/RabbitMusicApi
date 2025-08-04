const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment, validate } = require('../middleware/validators');
const { Payment, LessonStudent, Lesson, Student } = require('../models');

const router = express.Router();

router.post('/payments', authenticateToken, validatePayment, validate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student or admin access required' });
  }

  try {
    const { student_id, amount, lessons_included, lesson_id } = req.body;
    const payment = await Payment.create({
      payment_time: new Date(),
      student_id,
      amount,
      lessons_included,
      lesson_id,
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

router.post('/payments-with-selection', authenticateToken, validatePayment, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, lesson_id, amount, lessons_included } = req.body;

    // Verify student is enrolled in the lesson
    const enrollment = await LessonStudent.findOne({
      where: { student_id, lesson_id },
    });
    if (!enrollment) {
      return res.status(400).json({ error: 'Student is not enrolled in this lesson' });
    }

    const payment = await Payment.create({
      payment_time: new Date(),
      student_id,
      amount,
      lessons_included,
      lesson_id,
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment with selection:', error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

router.get('/payments-with-details', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { lesson_id } = req.query;
    const where = lesson_id ? { lesson_id: parseInt(lesson_id) } : {};

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Lesson,
          attributes: ['name'],
          required: true,
        },
        {
          model: Student,
          attributes: ['name'],
          required: true,
        },
      ],
      order: [['payment_time', 'DESC']],
    });

    const formattedPayments = payments.map((payment) => ({
      payment_id: payment.payment_id,
      lesson_name: payment.Lesson ? payment.Lesson.name : 'Unknown Lesson',
      payment_time: payment.payment_time,
      student_name: payment.Student ? payment.Student.name : 'Unknown Student',
      amount: payment.amount,
      lessons_included: payment.lessons_included,
    }));

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details', details: error.message });
  }
});

module.exports = router;