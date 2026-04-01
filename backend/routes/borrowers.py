from flask import Blueprint, request, jsonify
from backend.db import get_connection

borrowers_bp = Blueprint('borrowers', __name__)

@borrowers_bp.route('/add-borrower', methods=['POST'])
def add_borrower():
    data = request.json

    # validation
    required_fields = [
        'BorrowerID', 'BorrowerName', 'BorrowerType',
        'Email', 'PhoneNumber'
    ]

    for field in required_fields:
        if field not in data or data[field] == "":
            return jsonify({"error": f"{field} is required"}), 400

    # enforce correct borrower type (matches SQL CHECK)
    valid_types = ['Student', 'Academic Staff', 'Non-Academic Staff']
    if data['BorrowerType'] not in valid_types:
        return jsonify({"error": "Invalid BorrowerType"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            EXEC dbo.NewBorrower ?,?,?,?,?
        """, (
            data['BorrowerID'],
            data['BorrowerName'],
            data['BorrowerType'],
            data['Email'],
            data['PhoneNumber']
        ))

        conn.commit()

        return jsonify({"message": "Borrower added successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()