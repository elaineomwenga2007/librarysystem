from flask import Blueprint, jsonify
from db import get_connection

views_bp = Blueprint('views', __name__)

def fetch_view(query):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(query)

        columns = [col[0] for col in cursor.description]
        data = []

        for row in cursor.fetchall():
            record = dict(zip(columns, row))

            # Handle non-JSON serializable types (DATE, DECIMAL, etc.)
            for key, value in record.items():
                if hasattr(value, 'isoformat'):  # dates
                    record[key] = value.isoformat()
                elif isinstance(value, bytes):  # rare but safe
                    record[key] = value.decode()

            data.append(record)

        return data

    except Exception as e:
        return [{"error": str(e)}]

    finally:
        conn.close()


# ================= ROUTES =================
@views_bp.route('/books',methods=['GET'])
def get_books():
    return jsonify(fetch_view("SELECT * FROM Books_Inventory"))

@views_bp.route('/views/overdue', methods=['GET'])
def overdue():
    return jsonify(fetch_view("SELECT * FROM OverdueBooks"))


@views_bp.route('/views/active', methods=['GET'])
def active():
    return jsonify(fetch_view("SELECT * FROM ActiveLoans"))


@views_bp.route('/views/fines', methods=['GET'])
def fines():
    return jsonify(fetch_view("SELECT * FROM Fines"))


@views_bp.route('/views/available', methods=['GET'])
def available():
    return jsonify(fetch_view("SELECT * FROM BooksAvailable"))


@views_bp.route('/views/lost', methods=['GET'])
def lost():
    return jsonify(fetch_view("SELECT * FROM LostBooks"))


@views_bp.route('/views/blacklist', methods=['GET'])
def blacklist():
    return jsonify(fetch_view("SELECT * FROM Blacklist"))

@views_bp.route('/views/inventory')
def inventory():
    return jsonify(fetch_view("SELECT * FROM Books_Inventory"))

@views_bp.route('/views/publishers')
def publishers():
    return jsonify(fetch_view("SELECT * FROM PublisherDetails"))

@views_bp.route('/views/catalogues')
def catalogues():
    return jsonify(fetch_view("SELECT * FROM Catalogues"))

@views_bp.route('/views/reservations')
def reservations():
    return jsonify(fetch_view("SELECT * FROM Reservations"))

@views_bp.route('/views/returned')
def returned():
    return jsonify(fetch_view("SELECT * FROM ReturnTable"))

@views_bp.route('/views/borrowers')
def borrowers():
    return jsonify(fetch_view("SELECT * FROM BorrowerDetails"))



