""" from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from pymongo import MongoClient
from flask_cors import CORS
from pymongo.errors import PyMongoError
import os
import tempfile
from groq import Groq
import whisper

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Groq client
api= os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=api)

# Initialize Whisper model for speech-to-text
whisper_model = whisper.load_model("small")

# MongoDB setup
uri = "mongodb://localhost:27017/consultancy"
client = MongoClient(uri)
db = client['Consultancy']
users_collection = db['users']
doctors_collection = db['doctors']
conversations_collection = db['conversations']

def get_conversation_history(conversation_id):
    """Retrieve conversation history from database"""
    conversation = conversations_collection.find_one({"conversation_id": conversation_id})
    return conversation['history'] if conversation else []

def update_conversation_history(conversation_id, user_input, assistant_response):
    """Update conversation history in database"""
    conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {"$push": {"history": {"user": user_input, "assistant": assistant_response}}},
        upsert=True
    )

def get_doctor_info(doctor_ref):
    """Get doctor information by ID or name"""
    if doctor_ref.startswith('D') and doctor_ref[1:].isdigit():
        return doctors_collection.find_one({"id": doctor_ref}, {'_id': 0})
    else:
        return doctors_collection.find_one({"name": doctor_ref}, {'_id': 0})

def process_voice_input(audio_file):
    """Convert voice input to text using Whisper"""
    try:
        result = whisper_model.transcribe(audio_file)
        return result["text"]
    except Exception as e:
        print(f"Error in voice processing: {str(e)}")
        return None

def generate_groq_response(messages, model="llama-3.3-70b-versatile", temperature=0.7):
    """Generate response using Groq API"""
    try:
        completion = groq_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error in Groq API: {str(e)}")
        return None

@app.route('/chat', methods=['POST'])
def chat():
    try:
        conversation_id = request.form.get('conversation_id', 'default')
        input_type = 'text'
        user_input = None

        # Handle voice input
        if 'audio' in request.files:
            audio_file = request.files['audio']
            # Save temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                audio_file.save(tmp.name)
                tmp_path = tmp.name
            
            user_input = process_voice_input(tmp_path)
            os.unlink(tmp_path)  # Delete temporary file
            input_type = 'voice'
            if not user_input:
                return jsonify({"success": False, "message": "Could not process voice input"}), 400
        # Handle text input
        elif request.is_json:
            data = request.get_json()
            user_input = data.get('text')
            if not user_input:
                return jsonify({"success": False, "message": "Text input is required"}), 400

        if not user_input:
            return jsonify({"success": False, "message": "Input is required"}), 400

        # Get conversation history
        history = get_conversation_history(conversation_id)
        
        # Check if question is about doctors
        doctor_keywords = ["doctor", "dr.", "specialist", "availability", "schedule", "appointment"]
        is_doctor_query = any(keyword in user_input.lower() for keyword in doctor_keywords)
        
        # Prepare messages for Groq API
        messages = []
        
        # Add conversation history
        for h in history[-5:]:  # Keep last 5 exchanges for context
            messages.append({"role": "user", "content": h['user']})
            messages.append({"role": "assistant", "content": h['assistant']})
        
        if is_doctor_query:
            # Extract doctor references
            doctor_refs = []
            for doctor in doctors_collection.find({}, {'_id': 0}):
                if doctor['name'].lower() in user_input.lower() or doctor['id'].lower() in user_input.lower():
                    doctor_refs.append(doctor)
            
            if doctor_refs:
                # Add doctor context to the prompt
                doctor_context = "\n".join([f"Doctor {doc['name']} ({doc['id']}): Specializes in {doc['speciality']} at {doc['hospital']}. Availability: {doc.get('availability', 'Not specified')}" for doc in doctor_refs])
                system_prompt = f"""You are a helpful healthcare assistant. Use the following doctor information to answer the question:
                
                {doctor_context}
                
                Provide a concise response based on the doctor information. For medical advice, recommend consulting the doctor directly."""
            else:
                system_prompt = """You are a helpful healthcare assistant. The user is asking about doctors but didn't specify which one. 
                Please ask for clarification or provide general information about our doctors."""
        else:
            system_prompt = """You are a helpful healthcare assistant. Provide professional and caring responses. 
            For medical advice, always recommend consulting with a healthcare professional directly."""
        
        messages.insert(0, {"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_input})
        
        # Generate response
        response = generate_groq_response(messages)
        if not response:
            return jsonify({"success": False, "message": "Failed to generate response"}), 500
        
        # Update conversation history
        update_conversation_history(conversation_id, user_input, response)
        
        return jsonify({
            "success": True,
            "response": response,
            "conversation_id": conversation_id,
            "input_type": input_type
        }), 200
        
    except Exception as e:
        print("Chat error:", str(e))
        return jsonify({"success": False, "message": "An error occurred during chat"}), 500

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
    
@app.route('/doctors', methods=['GET', 'POST', 'DELETE'])
def doctors():
    try:
        if request.method == 'POST':
            data = request.get_json()
            
            # Basic validation
            required_fields = ['name', 'hospital', 'speciality']
            if not all(field in data for field in required_fields):
                return jsonify({"success": False, "message": "Missing required fields"}), 400
            
            # Get the next doctor ID
            last_doctor = doctors_collection.find_one(sort=[("id", -1)])
            last_id = int(last_doctor['id'][1:]) if last_doctor else 0
            new_id = f"D{last_id + 1}"
            
            # Insert new doctor
            doctor_data = {
                "id": new_id,
                "name": data['name'],
                "hospital": data['hospital'],
                "speciality": data['speciality'],
                "availability": data.get('availability', {}),
                "profilePhoto": data.get('profilePhoto')
            }
            
            result = doctors_collection.insert_one(doctor_data)
            return jsonify({
                "success": True,
                "message": "Doctor added successfully",
                "id": new_id
            }), 201
        
        elif request.method == 'GET':
            # Get all doctors
            doctors = list(doctors_collection.find({}, {'_id': 0}))
            return jsonify({
                "success": True,
                "doctors": doctors
            }), 200
            
        elif request.method == 'DELETE':
            doctor_id = request.args.get('id')
            if not doctor_id:
                return jsonify({"success": False, "message": "Doctor ID is required"}), 400
                
            result = doctors_collection.delete_one({"id": doctor_id})
            if result.deleted_count == 0:
                return jsonify({"success": False, "message": "Doctor not found"}), 404
                
            return jsonify({
                "success": True,
                "message": "Doctor deleted successfully"
            }), 200
            
    except PyMongoError as e:
        print("Database error:", str(e))
        return jsonify({"success": False, "message": "Database error occurred"}), 500
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"success": False, "message": "An error occurred"}), 500


if __name__ == '__main__':
    app.run(debug=True) """