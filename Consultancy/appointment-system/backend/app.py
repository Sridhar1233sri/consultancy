from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from pymongo import MongoClient
from flask_cors import CORS
from pymongo.errors import PyMongoError

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB Atlas URI
# uri = "mongodb+srv://sridharsri102004:sSXnRS6MJt3VRHhi@cluster0.aq6wqcf.mongodb.net/?retryWrites=true&w=majority&tls=true"
uri = "mongodb://localhost:27017/consultancy"
# Create MongoDB client
client = MongoClient(uri)
db = client['Consultancy']
users_collection = db['users']

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Appointment System Backend!"})

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = "user"

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify({"success": False, "message": "User with this email already exists"}), 400

        hashed_password = generate_password_hash(password)
        user_data = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "role": role
        }
        users_collection.insert_one(user_data)
        return jsonify({"success": True, "message": "User registered successfully"}), 201

    except PyMongoError as e:
        print("Database error:", str(e))
        return jsonify({"success": False, "message": "Database error occurred"}), 500
    except Exception as e:
        print("Unexpected error:", str(e))
        return jsonify({"success": False, "message": "An unexpected error occurred"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        if not check_password_hash(user['password'], password):
            return jsonify({"success": False, "message": "Incorrect password"}), 400

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "username": user['username'],
                "email": user['email']
            }
        }), 200

    except Exception as e:
        print("Login error:", str(e))
        return jsonify({"success": False, "message": "An error occurred during login"}), 500

if __name__ == '__main__':
    app.run(debug=True)
