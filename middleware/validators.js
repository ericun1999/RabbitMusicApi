const { body, param, validationResult } = require('express-validator');

const validateUser = [
  body('username').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  body('role').isIn(['student', 'teacher', 'admin']),
];

const validateStudent = [
  body('name').isString().trim().notEmpty(),
  body('phone').isString().trim().notEmpty(),
];

const validateTeacher = [
  body('name').isString().trim().notEmpty(),
  body('phone').isString().trim().notEmpty(),
];

const validateLesson = [
  body('name').isString().trim().notEmpty(),
  body('usual_time').isString().trim().notEmpty(),
  body('teacher_id').isInt(),
body('teacher_earning')
  .isDecimal({ decimal_digits: '2' }) // Ensures 2 decimal places
  .toFloat(), // Convert to float
body('student_paying')
  .isDecimal({ decimal_digits: '2' })
  .toFloat(),
];

const validatePayment = [
  body('amount')  .isDecimal({ decimal_digits: '2' })
  .toFloat(),
  body('lessons_included').isInt({ min: 1 }),
  body('lesson_id').isInt(),
];

const validateLessonStudent = [
  body('student_id').isInt(),
  body('lesson_id').isInt(),
];

const validateAttendance = [
  body('lesson_time').isISO8601().toDate(),
  body('lesson_id').isInt(),
];

const validateStudentAttendance = [
  body('student_id').isInt(),
  body('attendance_id').isInt(),
  body('attended').isBoolean().withMessage('Attended must be a boolean'),
];

const validateTeacherAttendance = [
  body('teacher_id').isInt(),
  body('teacher_earning')  .isDecimal({ decimal_digits: '2' })
  .toFloat(),
  body('attendance_id').isInt(),
  body('attended').isBoolean().withMessage('Attended must be a boolean'),
];

const validateLessonId = [
  param('lesson_id').isInt().withMessage('Lesson ID must be an integer'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateUser,
  validateStudent,
  validateTeacher,
  validateLesson,
  validatePayment,
  validateLessonStudent,
  validateAttendance,
  validateStudentAttendance,
  validateTeacherAttendance,
  validateLessonId,
  validate,
};