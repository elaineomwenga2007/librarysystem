from flask import Blueprint, request, jsonify
from db import get_connection

books_bp = Blueprint('books', __name__)

@books_bp.route('/add-book', methods=['POST'])
def add_book():
    data = request.json

    # Basic validation
    required_fields = [
        'BookID', 'Book_Title', 'BookType', 'Author',
        'PublisherID', 'Supplier', 'DateOfPurchase',
        'NumberOfCopies', 'Price'
    ]

    for field in required_fields:
        if field not in data or data[field] == "":
            return jsonify({"error": f"{field} is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            EXEC dbo.InsertBooks ?,?,?,?,?,?,?,?,?
        """, (
            data['BookID'],
            data['Book_Title'],
            data['BookType'],
            data['Author'],
            data['PublisherID'],
            data['Supplier'],
            data['DateOfPurchase'],   # make sure frontend sends YYYY-MM-DD
            data['NumberOfCopies'],
            data['Price']
        ))

        conn.commit()

        return jsonify({"message": "Book added successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@books_bp.route('/add-publisher', methods=['POST'])
def add_publisher():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("EXEC dbo.AddPublisher ?,?,?,?,?",
        data['PublisherID'],
        data['PublisherName'],
        data['Address'],
        data['Email'],
        data['PhoneNumber']
    )

    conn.commit()
    conn.close()
    return jsonify({"message": "Publisher added"})

@books_bp.route('/add-catalogue', methods=['POST'])
def add_catalogue():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("EXEC dbo.AddCatalogue ?,?,?,?",
        data['CatalogueID'],
        data['PublisherID'],
        data['DateReceived'],
        data['Description']
    )

    conn.commit()
    conn.close()
    return jsonify({"message": "Catalogue added"})

