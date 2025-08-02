from flask import Flask, request, jsonify
from os import getenv
from dotenv import load_dotenv
import pyodbc
from datetime import datetime
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database connection
def get_db_connection():
    try:
        conn_str = getenv("SQL_CONNECTION_STRING")
        if not conn_str:
            logger.error("SQL_CONNECTION_STRING is not set")
            raise ValueError("Database connection string not found")
        return pyodbc.connect(conn_str)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

# Error handling
def handle_error(e):
    return jsonify({"error": str(e)}), 500

# Students Endpoints
@app.route('/students', methods=['GET'])
def get_students():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Students")
        students = [
            {
                "StudentID": row.StudentID,
                "FirstName": row.FirstName,
                "LastName": row.LastName,
                "Email": row.Email,
                "EnrolledDate": row.EnrolledDate.isoformat() if row.EnrolledDate else None
            } for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return jsonify(students)
    except Exception as e:
        return handle_error(e)

@app.route('/students', methods=['POST'])
def create_student():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Students (FirstName, LastName, Email, EnrolledDate)
            VALUES (?, ?, ?, ?)
            """,
            (
                data['FirstName'],
                data['LastName'],
                data['Email'],
                data.get('EnrolledDate', datetime.now().date())
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Student created successfully"}), 201
    except Exception as e:
        return handle_error(e)

# Teachers Endpoints
@app.route('/teachers', methods=['GET'])
def get_teachers():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Teachers")
        teachers = [
            {
                "TeacherID": row.TeacherID,
                "FirstName": row.FirstName,
                "LastName": row.LastName,
                "Email": row.Email,
                "HourlyRate": float(row.HourlyRate)
            } for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return jsonify(teachers)
    except Exception as e:
        return handle_error(e)

@app.route('/teachers', methods=['POST'])
def create_teacher():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Teachers (FirstName, LastName, Email, HourlyRate)
            VALUES (?, ?, ?, ?)
            """,
            (
                data['FirstName'],
                data['LastName'],
                data['Email'],
                data['HourlyRate']
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Teacher created successfully"}), 201
    except Exception as e:
        return handle_error(e)

# Attendance Endpoints
@app.route('/attendance', methods=['GET'])
def get_attendance():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Attendance")
        attendance = [
            {
                "AttendanceID": row.AttendanceID,
                "StudentID": row.StudentID,
                "LessonDate": row.LessonDate.isoformat(),
                "TeacherID": row.TeacherID,
                "IsPresent": bool(row.IsPresent)
            } for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return jsonify(attendance)
    except Exception as e:
        return handle_error(e)

@app.route('/attendance', methods=['POST'])
def create_attendance():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Attendance (StudentID, LessonDate, TeacherID, IsPresent)
            VALUES (?, ?, ?, ?)
            """,
            (
                data['StudentID'],
                data['LessonDate'],
                data['TeacherID'],
                data['IsPresent']
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Attendance recorded successfully"}), 201
    except Exception as e:
        return handle_error(e)

# Payments Endpoints
@app.route('/payments', methods=['GET'])
def get_payments():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Payments")
        payments = [
            {
                "PaymentID": row.PaymentID,
                "StudentID": row.StudentID,
                "Amount": float(row.Amount),
                "PaymentDate": row.PaymentDate.isoformat(),
                "PaymentStatus": row.PaymentStatus
            } for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return jsonify(payments)
    except Exception as e:
        return handle_error(e)

@app.route('/payments', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Payments (StudentID, Amount, PaymentDate, PaymentStatus)
            VALUES (?, ?, ?, ?)
            """,
            (
                data['StudentID'],
                data['Amount'],
                data['PaymentDate'],
                data['PaymentStatus']
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Payment recorded successfully"}), 201
    except Exception as e:
        return handle_error(e)

# Salaries Endpoints
@app.route('/salaries', methods=['GET'])
def get_salaries():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Salaries")
        salaries = [
            {
                "SalaryID": row.SalaryID,
                "TeacherID": row.TeacherID,
                "Amount": float(row.Amount),
                "PaymentDate": row.PaymentDate.isoformat(),
                "HoursWorked": float(row.HoursWorked)
            } for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return jsonify(salaries)
    except Exception as e:
        return handle_error(e)

@app.route('/salaries', methods=['POST'])
def create_salary():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Salaries (TeacherID, Amount, PaymentDate, HoursWorked)
            VALUES (?, ?, ?, ?)
            """,
            (
                data['TeacherID'],
                data['Amount'],
                data['PaymentDate'],
                data['HoursWorked']
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Salary recorded successfully"}), 201
    except Exception as e:
        return handle_error(e)

# Financial Summary Endpoint (from previous query)
@app.route('/financial-summary', methods=['GET'])
def get_financial_summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                SUM(p.Amount) as TotalRevenue,
                SUM(s.Amount) as TotalSalaries,
                SUM(p.Amount) - SUM(s.Amount) as NetProfit
            FROM Payments p
            JOIN Salaries s ON p.PaymentDate = s.PaymentDate
            WHERE p.PaymentStatus = 'Completed'
            AND p.PaymentDate BETWEEN '2025-08-01' AND '2025-08-31'
            """
        )
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({
            "TotalRevenue": float(result.TotalRevenue) if result.TotalRevenue else 0,
            "TotalSalaries": float(result.TotalSalaries) if result.TotalSalaries else 0,
            "NetProfit": float(result.NetProfit) if result.NetProfit else 0
        })
    except Exception as e:
        return handle_error(e)

if __name__ == '__main__':
    # For local development only
    app.run(host='0.0.0.0', port=5000)