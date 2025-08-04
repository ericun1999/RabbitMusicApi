const express = require('express');
const { body, validationResult} = require('express-validator');
const { validate, validateAttendance, validateStudentAttendance, validateTeacherAttendance } = require('../middleware/validators')
const { authenticateToken } = require('../middleware/auth');
const { Attendance, LessonStudent, StudentAttendance, TeacherAttendance, Lesson, Teacher, Student } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

router.post(
  '/attendance',
  authenticateToken,
  [
    body('lesson_id').isInt().withMessage('Lesson ID must be an integer'),
    body('lesson_time').isISO8601().withMessage('Lesson time must be a valid ISO 8601 date'),
    body('teacher_id').isInt().withMessage('Teacher ID must be an integer'),
    body('teacher_attended').isBoolean().withMessage('Teacher attended must be a boolean'),
    body('teacher_earning')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('Teacher earning must be a decimal with up to 2 decimal places'),
    body('students').isArray().withMessage('Students must be an array'),
    body('students.*.student_id').isInt().withMessage('Student ID must be an integer'),
    body('students.*.attended').isBoolean().withMessage('Student attended must be a boolean'),
  ],
  async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lesson_id, lesson_time, teacher_id, teacher_attended, teacher_earning, students } = req.body;

    try {
      const lesson = await Lesson.findByPk(lesson_id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const teacher = await Teacher.findByPk(teacher_id);
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      for (const student of students) {
        const studentExists = await Student.findByPk(student.student_id);
        if (!studentExists) {
          return res.status(404).json({ error: `Student with ID ${student.student_id} not found` });
        }
      }

      const attendance = await Attendance.create({ lesson_id, lesson_time });

      const earning = teacher_earning
        ? parseFloat(teacher_earning).toFixed(2)
        : parseFloat(lesson.teacher_earning).toFixed(2);

      await TeacherAttendance.create({
        attendance_id: attendance.attendance_id,
        teacher_id,
        teacher_earning: earning,
        attended: teacher_attended,
      });

      for (const student of students) {
        await StudentAttendance.create({
          attendance_id: attendance.attendance_id,
          student_id: student.student_id,
          attended: student.attended,
        });
      }

      res.status(201).json({ message: 'Attendance recorded successfully', attendance });
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json({ error: 'Failed to record attendance', details: error.message });
    }
  }
);

router.get('/attendance-with-details', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { lesson_id } = req.query;
    const whereClause = lesson_id ? { lesson_id: parseInt(lesson_id) } : {};

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Lesson,
          attributes: ['name'],
          required: true,
        },
        {
          model: TeacherAttendance,
          include: [
            {
              model: Teacher,
              attributes: ['name'],
              required: true,
            },
          ],
          attributes: ['teacher_id', 'attended', 'teacher_earning'],
          required: false,
        },
        {
          model: StudentAttendance,
          include: [
            {
              model: Student,
              attributes: ['name', 'student_id'],
              required: true,
            },
          ],
          required: false,
        },
      ],
      order: [['lesson_time', 'DESC']],
    });

    const formattedAttendances = attendances.map((attendance) => ({
      attendance_id: attendance.attendance_id,
      lesson_name: attendance.Lesson ? attendance.Lesson.name : 'Unknown Lesson',
      lesson_time: attendance.lesson_time,
      teacher_id: attendance.TeacherAttendances[0]?.teacher_id,
      teacher_name: attendance.TeacherAttendances[0]?.Teacher?.name || 'Unknown Teacher',
      teacher_attended: attendance.TeacherAttendances[0]?.attended || false,
      teacher_earning: attendance.TeacherAttendances[0]?.teacher_earning
        ? parseFloat(attendance.TeacherAttendances[0].teacher_earning).toFixed(2)
        : '0.00',
      students: attendance.StudentAttendances.map((sa) => ({
        student_id: sa.Student.student_id,
        name: sa.Student.name,
        attended: sa.attended,
      })),
    }));

    res.status(200).json(formattedAttendances);
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({ error: 'Failed to fetch attendance details', details: error.message });
  }
});

router.put(
  '/attendance/:id',
  authenticateToken,
  [
    body('teacher_id').isInt().withMessage('Teacher ID must be an integer'),
    body('teacher_attended').isBoolean().withMessage('Teacher attended must be a boolean'),
    body('teacher_earning')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('Teacher earning must be a decimal with up to 2 decimal places'),
    body('student_attendances').isArray().withMessage('Student attendances must be an array'),
    body('student_attendances.*.student_id').isInt().withMessage('Student ID must be an integer'),
    body('student_attendances.*.attended').isBoolean().withMessage('Student attended must be a boolean'),
  ],
  async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { teacher_id, teacher_attended, teacher_earning, student_attendances } = req.body;

    try {
      const attendance = await Attendance.findByPk(id);
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      const lesson = await Lesson.findByPk(attendance.lesson_id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const teacher = await Teacher.findByPk(teacher_id);
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      for (const student of student_attendances) {
        const studentExists = await Student.findByPk(student.student_id);
        if (!studentExists) {
          return res.status(404).json({ error: `Student with ID ${student.student_id} not found` });
        }
      }

      const earning = teacher_earning
        ? parseFloat(teacher_earning).toFixed(2)
        : parseFloat(lesson.teacher_earning).toFixed(2);

      await TeacherAttendance.update(
        { teacher_id, attended: teacher_attended, teacher_earning: earning },
        { where: { attendance_id: id } }
      );

      for (const student of student_attendances) {
        await StudentAttendance.update(
          { attended: student.attended },
          { where: { attendance_id: id, student_id: student.student_id } }
        );
      }

      const updatedAttendance = await Attendance.findByPk(id, {
        include: [
          {
            model: Lesson,
            attributes: ['name'],
            required: true,
          },
          {
            model: TeacherAttendance,
            include: [
              {
                model: Teacher,
                attributes: ['name'],
                required: true,
              },
            ],
            attributes: ['teacher_id', 'attended', 'teacher_earning'],
            required: false,
          },
          {
            model: StudentAttendance,
            include: [
              {
                model: Student,
                attributes: ['name', 'student_id'],
                required: true,
              },
            ],
            required: false,
          },
        ],
      });

      const formattedAttendance = {
        attendance_id: updatedAttendance.attendance_id,
        lesson_name: updatedAttendance.Lesson ? updatedAttendance.Lesson.name : 'Unknown Lesson',
        lesson_time: updatedAttendance.lesson_time,
        teacher_id: updatedAttendance.TeacherAttendances[0]?.teacher_id,
        teacher_name: updatedAttendance.TeacherAttendances[0]?.Teacher?.name || 'Unknown Teacher',
        teacher_attended: updatedAttendance.TeacherAttendances[0]?.attended || false,
        teacher_earning: updatedAttendance.TeacherAttendances[0]?.teacher_earning
          ? parseFloat(updatedAttendance.TeacherAttendances[0].teacher_earning).toFixed(2)
          : '0.00',
        students: updatedAttendance.StudentAttendances.map((sa) => ({
          student_id: sa.Student.student_id,
          name: sa.Student.name,
          attended: sa.attended,
        })),
      };

      res.status(200).json(formattedAttendance);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Failed to update attendance', details: error.message });
    }
  }
);
router.post('/attendance-with-related', authenticateToken, validateAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { lesson_time, lesson_id } = req.body;

    // Create Attendance record
    const attendance = await Attendance.create({
      lesson_time,
      lesson_id,
    });

    // Fetch students enrolled in the lesson
    const lessonStudents = await LessonStudent.findAll({
      where: { lesson_id },
      attributes: ['student_id'],
    });

    // Create Student_Attendance records with attended: true
    const studentAttendanceRecords = lessonStudents.map(({ student_id }) => ({
      student_id,
      attendance_id: attendance.attendance_id,
      attended: true,
    }));
    if (studentAttendanceRecords.length > 0) {
      await StudentAttendance.bulkCreate(studentAttendanceRecords);
    }

    // Fetch teacher and earning from Lessons
    const lesson = await Lesson.findOne({
      where: { lesson_id },
      attributes: ['teacher_id', 'teacher_earning'],
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Create Teacher_Attendance record with attended: true
    await TeacherAttendance.create({
      teacher_id: lesson.teacher_id,
      teacher_earning: lesson.teacher_earning,
      attendance_id: attendance.attendance_id,
      attended: true,
    });

    res.status(201).json({
      attendance,
      studentAttendances: studentAttendanceRecords,
      teacherAttendance: {
        teacher_id: lesson.teacher_id,
        attendance_id: attendance.attendance_id,
        attended: true,
      },
    });
  } catch (error) {
    console.error('Error creating attendance with related records:', error);
    res.status(500).json({ error: 'Failed to create attendance with related records', details: error.message });
  }
});

router.post('/student-attendance', authenticateToken, validateStudentAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { student_id, attendance_id, attended } = req.body;
    const studentAttendance = await StudentAttendance.create({
      student_id,
      attendance_id,
      attended,
    });
    res.status(201).json(studentAttendance);
  } catch (error) {
    console.error('Error creating student attendance:', error);
    res.status(500).json({ error: 'Failed to create student attendance', details: error.message });
  }
});

router.post('/teacher-attendance', authenticateToken, validateTeacherAttendance, validate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { teacher_id, teacher_earning, attendance_id, attended } = req.body;
    const teacherAttendance = await TeacherAttendance.create({
      teacher_id,
      teacher_earning,
      attendance_id,
      attended,
    });
    res.status(201).json(teacherAttendance);
  } catch (error) {
    console.error('Error creating teacher attendance:', error);
    res.status(500).json({ error: 'Failed to create teacher attendance', details: error.message });
  }
});
module.exports = router;