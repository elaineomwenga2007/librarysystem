from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message

# import your routes
from backend.routes.books import books_bp
from backend.routes.borrowers import borrowers_bp
from backend.routes.loans import loans_bp
from backend.routes.views import views_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ================= EMAIL CONFIG =================
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'omwengaelaine@gmail.com'
app.config['MAIL_PASSWORD'] = 'yfcw kvpm ibur hbda'  
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']

mail = Mail(app)

# ================= REGISTER ROUTES =================
app.register_blueprint(books_bp)
app.register_blueprint(borrowers_bp)
app.register_blueprint(loans_bp)
app.register_blueprint(views_bp)

# ================= EMAIL ROUTE =================
@app.route('/send-borrow-email', methods=['POST'])
def send_borrow_email():
    data = request.json
    email = data.get('email')
    book = data.get('book')
    date = data.get('date')

    if not email or not book or not date:
        return jsonify({'error': 'Missing fields'}), 400

    try:
        msg = Message(
            subject='Library Borrow Request',
            sender=app.config['MAIL_USERNAME'],
            recipients=[email]
        )
        msg.body = f'Your request to borrow "{book}" on {date} has been received.'

        mail.send(msg)

        return jsonify({'message': 'Email sent successfully'})

    except Exception as e:
        print("Email error:", e)
        return jsonify({'error': 'Failed to send email'}), 500

        return jsonify({"error": str(e)}), 500
        
@app.route('/views/<view_type>', methods=['GET'])
def get_view(view_type):
    try:
        if view_type == "books":
            # example query
            cursor.execute("SELECT * FROM books")
        elif view_type == "borrowers":
            cursor.execute("SELECT * FROM borrowers")
        else:
            return jsonify({"error": "Invalid view type"}), 400

        rows = cursor.fetchall()

        # convert to list of dictionaries
        columns = [column[0] for column in cursor.description]
        result = [dict(zip(columns, row)) for row in rows]

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= TEST ROUTE =================
@app.route('/')
def home():
    return {"message": "Library API running"}

# ================= RUN =================
if __name__ == '__main__':
    app.run(debug=True,port=5000)

print(app.url_map)