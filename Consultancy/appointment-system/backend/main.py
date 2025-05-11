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
import tempfile
import json
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime, timedelta
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
appointments_collection = db['appointments']
# Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_audio(audio_bytes):
    """Transcribe audio using Whisper via Groq API"""
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        # Transcribe using Groq API
        with open(temp_audio_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                response_format="text"
            )
        
        # Clean up
        os.unlink(temp_audio_path)
        
        # Handle different response formats
        if isinstance(transcription, str):
            return transcription.strip()
        elif hasattr(transcription, 'text'):
            return transcription.text.strip()
        else:
            print(f"Unexpected transcription format: {type(transcription)}")
            return None
            
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return None

def classify_intent(text):
    """Classify user intent using Mistral-7b model via Groq API"""
    try:
        if not text.strip():
            return "general_query"
        
        prompt = f"""Classify the following user message into one of these categories:
        - greeting: for greetings like hello, hi, etc.
        - doctor_query: for questions about doctors, appointments, specialists
        - appointment_query: for questions about existing appointments or booking new ones
        - general_query: for all other healthcare questions

        User message: "{text}"

        Return only the category name (greeting, doctor_query, appointment_query, or general_query)."""
        
        completion = groq_client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=10,
        )
        
        response = completion.choices[0].message.content.lower().strip()
        valid_intents = ["greeting", "doctor_query", "appointment_query", "general_query"]
        print(f"Classified intent: {response}")
        return response if response in valid_intents else "general_query"
    
    except Exception as e:
        print(f"Error in intent classification: {str(e)}")
        if any(word in text.lower() for word in ["hello", "hi", "hey"]):
            return "greeting"
        elif any(word in text.lower() for word in ["doctor", "specialist", "appointment"]):
            return "doctor_query"
        elif any(word in text.lower() for word in ["book", "appointment", "schedule", "availability"]):
            return "appointment_query"
        return "general_query"


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
    
def check_doctor_availability(doctor_id, date, time):
    """Check if a doctor is available at a specific date and time"""
    try:
        # Parse the input date and time
        appointment_date = datetime.strptime(date, '%Y-%m-%d').date()
        start_time = datetime.strptime(time, '%H:%M').time()
        start_datetime = datetime.combine(appointment_date, start_time)
        end_datetime = start_datetime + timedelta(hours=1)
        
        # Check for overlapping appointments
        existing = appointments_collection.find_one({
            "doctorId": doctor_id,
            "date": date,
            "$expr": {
                "$and": [
                    {
                        "$lt": [
                            {"$dateFromString": {
                                "dateString": {"$concat": ["$date", "T", "$time", ":00"]},
                                "format": "%Y-%m-%dT%H:%M:%S"
                            }},
                            end_datetime
                        ]
                    },
                    {
                        "$gt": [
                            {
                                "$add": [
                                    {"$dateFromString": {
                                        "dateString": {"$concat": ["$date", "T", "$time", ":00"]},
                                        "format": "%Y-%m-%dT%H:%M:%S"
                                    }},
                                    3600000  # Add 1 hour in milliseconds
                                ]
                            },
                            start_datetime
                        ]
                    }
                ]
            }
        })
        
        return existing is None
    
    except Exception as e:
        print(f"Error checking availability: {str(e)}")
        return False
    
def get_doctor_appointments(doctor_id, date=None):
    """Get all appointments for a doctor, optionally filtered by date"""
    query = {"doctorId": doctor_id}
    if date:
        query["date"] = date
    
    appointments = list(appointments_collection.find(query, {
        "_id": 0,
        "doctorId": 1,
        "doctorName": 1,
        "doctorSpeciality": 1,
        "doctorHospital": 1,
        "date": 1,
        "time": 1,
        "startDateTime": 1,
        "endDateTime": 1
    }))
    
    return appointments

def generate_appointment_response(question, conversation_id):
    """Generate response for appointment-related queries"""
    try:
        # First extract doctor name and date/time from the question
        prompt_extract = f"""Extract the following information from the user's question:
        - doctor_name: The name of the doctor (or empty if not mentioned)
        - date: The date in YYYY-MM-DD format (or empty if not mentioned)
        - time: The time in HH:MM format (or empty if not mentioned)
        
        Return ONLY a JSON object with these three fields. Do not include any other text.
        
        User question: "{question}"
        """
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_extract}],
            temperature=0.1,
            max_tokens=100,
            response_format={"type": "json_object"}
        )
        
        extracted = json.loads(completion.choices[0].message.content)
        doctor_name = extracted.get("doctor_name", "").strip()
        date = extracted.get("date", "").strip()
        time = extracted.get("time", "").strip()
        
        print(f"Extracted details - Doctor: {doctor_name}, Date: {date}, Time: {time}")
        
        # If doctor name is not provided, ask for it
        if not doctor_name:
            return "Could you please specify which doctor you're asking about?"
        
        # Search for the doctor
        doctors = get_doctor_data(doctor_name)
        if not doctors:
            return "I couldn't find that doctor in our system. Please check the name and try again."
        
        doctor = doctors[0]  # Take the first matching doctor
        
        # If date or time is not provided, ask for it
        if not date or not time:
            if not date and not time:
                return f"Dr. {doctor['name']} is available on {doctor.get('availability', {}).get('days', 'weekdays')}. When would you like to check availability?"
            elif not date:
                return f"Please specify the date you'd like to check for Dr. {doctor['name']} (e.g., YYYY-MM-DD)."
            else:
                return f"Please specify the time you'd like to check for Dr. {doctor['name']} on {date} (e.g., HH:MM)."
        
        # Check availability
        is_available = check_doctor_availability(doctor['id'], date, time)
        
        if is_available:
            return f"Dr. {doctor['name']} is available on {date} at {time}. Would you like to book this appointment?"
        else:
            # Get doctor's existing appointments to suggest alternatives
            appointments = get_doctor_appointments(doctor['id'], date)
            booked_slots = [appt['time'] for appt in appointments]
            
            # Generate suggested times (same date, different times)
            all_slots = [f"{hour:02d}:00" for hour in range(9, 18)]
            available_slots = [slot for slot in all_slots if slot not in booked_slots]
            
            if available_slots:
                suggestions = ", ".join(available_slots[:3])  # Show first 3 available slots
                return f"Dr. {doctor['name']} already has an appointment at {time} on {date}. Available times that day include: {suggestions}. Would you like one of these instead?"
            else:
                return f"Dr. {doctor['name']} is fully booked on {date}. Please try another day."
    
    except Exception as e:
        print(f"Error generating appointment response: {str(e)}")
        return "I encountered an error checking the appointment. Please try again with specific details about the doctor and time."

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
        # Check content type and handle accordingly
        if request.content_type.startswith('multipart/form-data'):
            # Handle audio upload
            if 'audio' not in request.files:
                return jsonify({"success": False, "message": "No audio file provided"}), 400
            
            audio_file = request.files['audio']
            if audio_file.filename == '':
                return jsonify({"success": False, "message": "Empty audio file"}), 400

            # Read audio data into memory
            audio_bytes = audio_file.read()
            if not audio_bytes:
                return jsonify({"success": False, "message": "Could not read audio data"}), 400

            # Transcribe audio
            try:
                question = transcribe_audio(audio_bytes)
                if not question:
                    return jsonify({"success": False, "message": "Audio transcription failed"}), 400
            except Exception as e:
                print(f"Transcription error: {str(e)}")
                return jsonify({"success": False, "message": "Error transcribing audio"}), 500

            conversation_id = request.form.get('conversation_id')
            
        elif request.content_type == 'application/json':
            # Handle JSON request
            data = request.get_json()
            question = data.get('question')
            conversation_id = data.get('conversation_id')
        else:
            return jsonify({"success": False, "message": "Unsupported content type"}), 415

        # Validate required fields
        if not question:
            return jsonify({"success": False, "message": "No question provided"}), 400
        if not conversation_id:
            return jsonify({"success": False, "message": "Conversation ID is required"}), 400

        # Retrieve or create conversation (using find_one_and_update for atomic operation)
        conversation = conversations_collection.find_one_and_update(
            {"conversation_id": conversation_id},
            {
                "$setOnInsert": {
                    "conversation_id": conversation_id,
                    "created_at": datetime.utcnow()
                },
                "$set": {
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True,
            return_document=True
        )

        # Get existing history or initialize empty array
        history = conversation.get('history', [])

        # Classify intent
        intent = classify_intent(question)
        
        # Generate appropriate response
        if intent == "doctor_query":
            doctors = get_doctor_data(question)
            response = generate_doctor_response(question, doctors)
        elif intent == "appointment_query":
            response = generate_appointment_response(question, conversation_id)
        else:
            # Format history for context (last 4 messages)
            history_context = "\n".join(
                [f"{msg['role']}: {msg['content']}" 
                 for msg in history[-4:]] if history else []
            )
            response = generate_general_response(question, history_context)

        # Prepare new messages to add
        new_messages = [
            {"role": "user", "content": question, "timestamp": datetime.utcnow()},
            {"role": "assistant", "content": response, "timestamp": datetime.utcnow()}
        ]

        # Update conversation history (using $push with $each)
        conversations_collection.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {
                    "history": {
                        "$each": new_messages,
                        "$slice": -20  # Keep only last 20 messages to prevent unbounded growth
                    }
                },
                "$set": {
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return jsonify({
            "success": True,
            "response": response,
            "conversation_id": conversation_id,
            "intent": intent
        })

    except PyMongoError as e:
        print(f"MongoDB error: {str(e)}")
        return jsonify({"success": False, "message": "Database error occurred"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"success": False, "message": "An unexpected error occurred"}), 500


def process_chat_message(question, conversation_id):
    try:
        # Retrieve or create conversation
        conversation = conversations_collection.find_one({"conversation_id": conversation_id})
        if not conversation:
            conversation = {
                "conversation_id": conversation_id,
                "history": [],
                "created_at": datetime.utcnow()
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
        update_data = {
            "$push": {
                "history": {
                    "$each": [
                        {"role": "user", "content": question, "timestamp": datetime.utcnow()},
                        {"role": "assistant", "content": response, "timestamp": datetime.utcnow()}
                    ]
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
        
        conversations_collection.update_one(
            {"conversation_id": conversation_id},
            update_data
        )

        return jsonify({
            "success": True,
            "response": response,
            "conversation_id": conversation_id,
            "intent": intent
        })

    except PyMongoError as e:
        print(f"MongoDB error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Database error occurred"
        }), 500
        
    except Exception as e:
        print(f"Chat processing error: {str(e)}")
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
    
appointments_collection = db['appointments']

@app.route('/appointments', methods=['GET', 'POST'])
def handle_appointments():
    if request.method == 'GET':
        email = request.args.get('email')
        if not email:
            return jsonify({"success": False, "message": "Email parameter is required"}), 400
        
        appointments = list(appointments_collection.find({"patientEmail": email}))
        # Convert ObjectId to string and remove sensitive fields
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
            # Don't remove patientEmail here since we're filtering by it
            # appt.pop('patientEmail', None)
        
        return jsonify({"success": True, "appointments": appointments}), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        required_fields = [
            'patientEmail', 'patientName', 'doctorId', 'doctorName',
            'doctorSpeciality', 'doctorHospital', 'date', 'time', 'issue'
        ]
        
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        try:
            # Parse the input date and time
            appointment_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            if appointment_date < datetime.today().date():
                return jsonify({"success": False, "message": "Appointment date cannot be in the past"}), 400
            
            # Parse the time and calculate end time (1 hour later)
            start_time = datetime.strptime(data['time'], '%H:%M').time()
            start_datetime = datetime.combine(appointment_date, start_time)
            end_datetime = start_datetime + timedelta(hours=1)
            
            # Check if doctor exists
            doctor = doctors_collection.find_one({"id": data['doctorId']})
            if not doctor:
                return jsonify({"success": False, "message": "Doctor not found"}), 404
            
            # Check for overlapping appointments (enhanced validation)
            existing = appointments_collection.find_one({
    "doctorId": data['doctorId'],
    "date": data['date'],
    "$expr": {
        "$and": [
            {
                "$lt": [
                    {"$dateFromString": {
                        "dateString": {"$concat": ["$date", "T", "$time", ":00"]},
                        "format": "%Y-%m-%dT%H:%M:%S"
                    }},
                    end_datetime
                ]
            },
            {
                "$gt": [
                    {
                        "$add": [
                            {"$dateFromString": {
                                "dateString": {"$concat": ["$date", "T", "$time", ":00"]},
                                "format": "%Y-%m-%dT%H:%M:%S"
                            }},
                            3600000  # Add 1 hour in milliseconds
                        ]
                    },
                    start_datetime
                ]
            }
        ]
    }
})

            
            if existing:
                return jsonify({
                    "success": False, 
                    "message": "This time slot is already booked or overlaps with another appointment"
                }), 400
            
            appointment_data = {
                "patientEmail": data['patientEmail'],
                "patientName": data['patientName'],
                "doctorId": data['doctorId'],
                "doctorName": data['doctorName'],
                "doctorSpeciality": data['doctorSpeciality'],
                "doctorHospital": data['doctorHospital'],
                "date": data['date'],
                "time": data['time'],
                "issue": data['issue'],
                "startDateTime": start_datetime,
                "endDateTime": end_datetime,
                "createdAt": datetime.utcnow()
            }
            
            result = appointments_collection.insert_one(appointment_data)
            return jsonify({
                "success": True,
                "message": "Appointment booked successfully",
                "id": str(result.inserted_id)
            }), 201

        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid date/time format: {str(e)}"}), 400
        except Exception as e:
            print(f"Error creating appointment: {str(e)}")
            return jsonify({"success": False, "message": "An error occurred while booking appointment"}), 500

@app.route('/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    try:
        obj_id = ObjectId(appointment_id)
    except:
        return jsonify({"success": False, "message": "Invalid appointment ID"}), 400
    
    result = appointments_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        return jsonify({"success": False, "message": "Appointment not found"}), 404
    
    return jsonify({"success": True, "message": "Appointment cancelled successfully"}), 200

@app.route('/adminappointments', methods=['GET'])
def get_all_appointments():
    try:
        # Get all appointments (admin view)
        appointments = list(appointments_collection.find({}))
        
        # Convert ObjectId to string and format for response
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
        
        return jsonify({
            "success": True,
            "appointments": appointments
        }), 200
        
    except PyMongoError as e:
        print("Database error:", str(e))
        return jsonify({"success": False, "message": "Database error occurred"}), 500
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"success": False, "message": "An error occurred"}), 500
    
@app.route('/appointments/availability', methods=['GET'])
def check_availability():
    doctor_id = request.args.get('doctorId')
    date = request.args.get('date')
    
    if not doctor_id or not date:
        return jsonify({"success": False, "message": "Doctor ID and date are required"}), 400
    
    try:
        # Get all appointments for this doctor on this date
        appointments = list(appointments_collection.find({
            "doctorId": doctor_id,
            "date": date
        }))
        
        # Generate all possible slots (9am to 5pm)
        all_slots = [f"{hour:02d}:00" for hour in range(9, 18)]
        
        # Get booked slots
        booked_slots = [appt['time'] for appt in appointments]
        
        # Calculate available slots
        available_slots = [slot for slot in all_slots if slot not in booked_slots]
        
        return jsonify({
            "success": True,
            "availableSlots": available_slots
        })
        
    except Exception as e:
        print(f"Error checking availability: {str(e)}")
        return jsonify({"success": False, "message": "Error checking availability"}), 500
    
if __name__ == '__main__':
    app.run(debug=True)