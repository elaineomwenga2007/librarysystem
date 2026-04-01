from flask import Blueprint, request, jsonify
from backend.db import get_connection

loans_bp = Blueprint('loans', __name__)

# ================= BORROW BOOK =================
@loans_bp.route('/borrow', methods=['POST'])
def borrow_book():
    data = request.json

    if not data.get('BorrowerID') or not data.get('BookID') or not data.get('DateOfIssue'):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            EXEC dbo.AddLoan ?,?,?
        """, (
            data['BorrowerID'],
            data['BookID'],
            data['DateOfIssue']
        ))

        conn.commit()

        return jsonify({"message": "Borrow successful"})

    except Exception as e:
        print("Borrow error:", e)
        return jsonify({"error": "Borrow failed"}), 500

    finally:
        conn.close()

# RESERVE BOOK
@loans_bp.route('/reserve', methods=['POST'])
def reserve_book():
    from flask import current_app
    from flask_mail import Message
    from app import mail

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Insert reservation
        cursor.execute("""
            EXEC dbo.AddReservations ?,?,?
        """, (
            data['BookID'],
            data['BorrowerID'],
            data['Status']
        ))

        conn.commit()

        # Send email
        if data.get('email'):
            msg = Message(
                subject='Book Reservation Request',
                sender=current_app.config['MAIL_USERNAME'],
                recipients=[data['email']]
            )
            msg.body = f"""
Your reservation request has been received.

Book ID: {data['BookID']}

You will be notified once the book becomes available.
"""

            mail.send(msg)

        return jsonify({"message": "Reservation successful"})

    except Exception as e:
        print("Reservation error:", e)
        return jsonify({"error": "Reservation failed"}), 500

    finally:
        conn.close()
        
# ================= RETURN BOOK =================
@loans_bp.route('/return', methods=['POST'])
def return_book():
    data = request.json

    if not data.get('LoanID') or not data.get('BorrowerID') or not data.get('BookID'):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            EXEC dbo.ReturnBook ?,?,?
        """, (
            data['LoanID'],
            data['BorrowerID'],
            data['BookID']
        ))

        conn.commit()

        return jsonify({"message": "Return processed"})

    except Exception as e:
        print("Return error:", e)
        return jsonify({"error": "Return failed"}), 500

    finally:
        conn.close()