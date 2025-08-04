const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateLesson, validateLessonStudent, validate } = require('../middleware/validators');
const { Lesson, LessonStudent } = require('../models');

const router = express.Router();

router.get('/lessons', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const lessons = await Lesson.findAll({
      attributes: ['lesson_id', 'name'],
    });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons', details: error.message });
  }
});

router.post('/lessons', authenticateToken, validateLesson, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { name, usual_time, teacher_id, teacher_earning, student_paying } = req.body;
    const lesson = await Lesson.create({
      name,
      usual_time,
      teacher_id,
      teacher_earning,
      student_paying,
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lesson', details: error.message });
  }
});

router.get('/lesson-students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const lessonStudents = await LessonStudent.findAll({
      attributes: ['lesson_id', 'student_id'],
    });
    res.json(lessonStudents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lesson-student assignments', details: error.message });
  }
});

router.post('/lesson-students', authenticateToken, validateLessonStudent, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, lesson_id } = req.body;
    const lessonStudent = await LessonStudent.create({
      student_id,
      lesson_id,
    });
    res.status(201).json(lessonStudent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign student to lesson', details: error.message });
  }
});

module.exports = router;