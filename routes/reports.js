const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { TeacherAttendance, Attendance, Lesson, Teacher, Payment, StudentAttendance, Student } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/teacher-salaries', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { teacher_id, start_date, end_date } = req.query;

    if (!teacher_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Teacher ID, start date, and end date are required' });
    }

    const salaries = await TeacherAttendance.findAll({
      where: {
        teacher_id: parseInt(teacher_id),
        attended: true,
      },
      include: [
        {
          model: Attendance,
          where: {
            lesson_time: {
              [Op.between]: [new Date(start_date), new Date(end_date)],
            },
          },
          include: [
            {
              model: Lesson,
              attributes: ['name'],
              required: true,
            },
          ],
          required: true,
        },
      ],
      attributes: ['teacher_earning'],
    });

    const totalEarnings = salaries.reduce((sum, record) => sum + parseFloat(record.teacher_earning), 0);

    const formattedRecords = salaries.map((record) => ({
      attendance_id: record.Attendance.attendance_id,
      lesson_name: record.Attendance.Lesson ? record.Attendance.Lesson.name : 'Unknown Lesson',
      lesson_time: record.Attendance.lesson_time,
      teacher_earning: parseFloat(record.teacher_earning).toFixed(2),
    }));

    res.status(200).json({
      total_earnings: totalEarnings.toFixed(2),
      records: formattedRecords,
    });
  } catch (error) {
    console.error('Error fetching teacher salaries:', error);
    res.status(500).json({ error: 'Failed to fetch teacher salaries', details: error.message });
  }
});

router.get('/student-remaining-lessons', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, lesson_id } = req.query;

    if (!student_id || !lesson_id) {
      return res.status(400).json({ error: 'Student ID and lesson ID are required' });
    }

    const payments = await Payment.findAll({
      where: {
        student_id: parseInt(student_id),
        lesson_id: parseInt(lesson_id),
      },
      attributes: ['payment_id', 'payment_time', 'amount', 'lessons_included'],
    });

    const attendances = await StudentAttendance.findAll({
      where: {
        student_id: parseInt(student_id),
      },
      include: [
        {
          model: Attendance,
          where: { lesson_id: parseInt(lesson_id) },
          attributes: ['attendance_id', 'lesson_time'],
          required: true,
        },
      ],
      attributes: ['attended'],
    });

    const totalLessonsIncluded = payments.reduce((sum, payment) => sum + payment.lessons_included, 0);
    const attendedLessons = attendances.filter((a) => a.attended).length;
    const remainingLessons = totalLessonsIncluded - attendedLessons;

    const formattedPayments = payments.map((payment) => ({
      payment_id: payment.payment_id,
      payment_time: payment.payment_time,
      amount: parseFloat(payment.amount).toFixed(2),
      lessons_included: payment.lessons_included,
    }));

    const formattedAttendances = attendances.map((attendance) => ({
      attendance_id: attendance.Attendance.attendance_id,
      lesson_time: attendance.Attendance.lesson_time,
      attended: attendance.attended,
    }));

    res.status(200).json({
      remaining_lessons: remainingLessons,
      payments: formattedPayments,
      attendances: formattedAttendances,
    });
  } catch (error) {
    console.error('Error fetching student remaining lessons:', error);
    res.status(500).json({ error: 'Failed to fetch remaining lessons', details: error.message });
  }
});

module.exports = router;