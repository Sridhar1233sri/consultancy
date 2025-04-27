from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from pymongo import MongoClient
from flask_cors import CORS
from pymongo.errors import PyMongoError
import os
from groq import Groq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferWindowMemory
import requests
from io import BytesIO
import tempfile
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize clients
uri = "mongodb://localhost:27017/consultancy"
client = MongoClient(uri)
db = client['Consultancy']
users_collection = db['users']
doctors_collection = db['doctors']
conversations_collection = db['conversations']

# Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_audio(audio_data):
    """Transcribe audio using Whisper-large-v3-turbo model via Groq API"""
    try:
        # Create a temporary file to store the audio data
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        # Transcribe using Groq API
        with open(temp_audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(temp_audio_path, file.read()),
                model="whisper-large-v3-turbo",
                response_format="text",
            )
        
        # Clean up the temporary file
        os.unlink(temp_audio_path)
        
        return transcription.text
    
    except Exception as e:
        print(f"Error in audio transcription: {str(e)}")
        return "Could not transcribe audio. Please try again."

def classify_intent(text):
    """Classify user intent using Mistral-7b model via Groq API"""
    try:
        if not text.strip():
            return "general_query"
        
        prompt = f"""Classify the following user message into one of these categories:
        - greeting: for greetings like hello, hi, etc.
        - doctor_query: for questions about doctors, appointments, specialists
        - general_query: for all other healthcare questions

        User message: "{text}"

        Return only the category name (greeting, doctor_query, or general_query)."""
        
        completion = groq_client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=10,
        )
        
        response = completion.choices[0].message.content.lower().strip()
        valid_intents = ["greeting", "doctor_query", "general_query"]
        print(f"Classified intent: {response}")
        return response if response in valid_intents else "general_query"
    
    except Exception as e:
        print(f"Error in intent classification: {str(e)}")
        if any(word in text.lower() for word in ["hello", "hi", "hey"]):
            return "greeting"
        elif any(word in text.lower() for word in ["doctor", "specialist", "appointment"]):
            return "doctor_query"
        return "general_query"

""" def get_doctor_data(query):
    doctors = list(doctors_collection.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"speciality": {"$regex": query, "$options": "i"}},
            {"hospital": {"$regex": query, "$options": "i"}},
            {"availability.days": {"$regex": query, "$options": "i"}},
            {"availability.time": {"$regex": query, "$options": "i"}},
        ]
    }, {'_id': 0}))
    print(doctors)
    return doctors """
def get_doctor_data(query):
    """Enhanced doctor search with better name matching"""
    try:
        print(f"Searching for: '{query}'")  # Debug logging
        
        # Clean and prepare the query
        query = query.strip().lower()
        
        # First try exact name match (case insensitive)
        doctors = list(doctors_collection.find(
            {"name": {"$regex": f"^{query}$", "$options": "i"}},
            {'_id': 0}
        ))
        
        if doctors:
            print("Found by exact name match")
            return doctors
            
        # If no exact match, try partial name matching
        name_parts = query.split()
        name_conditions = []
        
        for part in name_parts:
            if len(part) > 1:  # Ignore single characters
                name_conditions.append({"name": {"$regex": part, "$options": "i"}})
        
        if name_conditions:
            doctors = list(doctors_collection.find(
                {"$and": name_conditions},
                {'_id': 0}
            ))
            
            if doctors:
                print("Found by partial name match")
                return doctors
        
        # If still no match, try broader search across all fields
        search_conditions = []
        for part in name_parts:
            if len(part) > 1:
                search_conditions.append({
                    "$or": [
                        {"name": {"$regex": part, "$options": "i"}},
                        {"speciality": {"$regex": part, "$options": "i"}},
                        {"hospital": {"$regex": part, "$options": "i"}},
                        {"availability.days": {"$regex": part, "$options": "i"}},
                    ]
                })
        
        if search_conditions:
            doctors = list(doctors_collection.find(
                {"$and": search_conditions},
                {'_id': 0}
            ))
            
            if doctors:
                print("Found by broad field search")
                return doctors
        
        # Final fallback - show all doctors if no matches
        print("No matches found, returning all doctors")
        return list(doctors_collection.find({}, {'_id': 0}))
    
    except Exception as e:
        print(f"Error in doctor search: {str(e)}")
        return []

def generate_doctor_response(question, doctors):
    print("doctor queries")
    """Generate a response specifically for doctor queries using only the provided doctor data"""
    if not doctors:
        return "I couldn't find any doctors matching your query. Please try different search terms."
    
    prompt = f"""You are a healthcare assistant helping users find doctors. 
    Strictly use ONLY the following doctor information to answer the question. 
    Do NOT invent any details not present in the data. 
    Do NOT offer to book appointments - just provide the information.
    
    User question: {question}
    
    Doctor data: {json.dumps(doctors, indent=2)}
    
    Provide a concise response (1-2 sentences) with only the relevant information from the data."""
    
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
    )
    
    return completion.choices[0].message.content

def generate_general_response(question, history):
    print("greeting")
    """Generate response for general health questions"""
    prompt = """You are a helpful healthcare assistant named MediCare AI. 
    Be polite, professional and empathetic. 
    Provide concise (1-2 sentence) responses to health questions.
    Do NOT provide medical diagnoses - suggest consulting a doctor instead.
    
    Conversation history: {history}
    
    Current question: {question}"""
    
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt.format(history=history, question=question)}],
        temperature=0.7,
        max_tokens=300,
    )
    
    return completion.choices[0].message.content

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        question = data.get('question')
        conversation_id = data.get('conversation_id')
        audio_data = data.get('audio_data')
        
        if audio_data:
            import base64
            audio_bytes = base64.b64decode(audio_data)
            question = transcribe_audio(audio_bytes)
        
        if not question:
            return jsonify({"success": False, "message": "No question provided"}), 400
        
        # Retrieve or create conversation
        conversation = conversations_collection.find_one({"conversation_id": conversation_id})
        if not conversation:
            conversation = {
                "conversation_id": conversation_id,
                "history": []
            }
            conversations_collection.insert_one(conversation)
        
        # Classify intent
        intent = classify_intent(question)
        
        # Generate appropriate response
        if intent == "doctor_query":
            doctors = get_doctor_data(question)
            response = generate_doctor_response(question, doctors)
        else:
            history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation['history'][-4:]])
            response = generate_general_response(question, history)
        
        # Update conversation history
        conversation["history"].extend([
            {"role": "user", "content": question},
            {"role": "assistant", "content": response}
        ])
        
        conversations_collection.update_one(
            {"conversation_id": conversation_id},
            {"$set": {"history": conversation["history"]}}
        )
        
        return jsonify({
            "success": True,
            "response": response,
            "conversation_id": conversation_id
        }), 200
        
    except Exception as e:
        print("Chat error:", str(e))
        return jsonify({
            "success": False,
            "message": "An error occurred during chat processing"
        }), 500


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
    app.run(debug=True)