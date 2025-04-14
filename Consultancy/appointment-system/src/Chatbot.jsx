// src/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your healthcare assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, []);

  // Scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage = { text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      handleBotResponse(inputText);
    }, 600);
  };

  const handleBotResponse = (userText) => {
    // Simple responses based on keywords - replace with actual backend integration
    let botResponse = "I'm sorry, I don't have information about that yet. Please contact our support team for more assistance.";
    
    const text = userText.toLowerCase();
    
    if (text.includes('appointment') || text.includes('book') || text.includes('schedule')) {
      botResponse = "To book an appointment, please select a doctor from the list and click the appointment button. You can also call our reception at 123-456-7890.";
    } else if (text.includes('doctor') || text.includes('specialist')) {
      botResponse = "We have specialists in Oncology, Neurology, Pulmonology, and Cardiology. You can view all doctors in the list above.";
    } else if (text.includes('timing') || text.includes('hours') || text.includes('available')) {
      botResponse = "Each doctor has different availability hours. Please check the availability section in the doctor's information card.";
    } else if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      botResponse = "Hello! How can I assist you with your healthcare needs today?";
    } else if (text.includes('thank')) {
      botResponse = "You're welcome! Is there anything else I can help you with?";
    }
    
    const botMessage = { text: botResponse, sender: 'bot' };
    setMessages(prev => [...prev, botMessage]);
  };

  const startListening = () => {
    if (!recognition.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    setIsListening(true);
    recognition.current.start();
  };

  const stopListening = () => {
    if (!recognition.current) return;
    
    recognition.current.stop();
    setIsListening(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot Button */}
      <button
        onClick={toggleChatbot}
        className="bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl w-80 md:w-96 max-h-96 flex flex-col">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Healthcare Assistant</h3>
            <button onClick={toggleChatbot} className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-64">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded-lg max-w-3/4 ${
                  message.sender === 'user' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* Voice Button */}
            <button 
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 ${isListening ? 'bg-red-500' : 'bg-gray-200'} text-white rounded-none`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            {/* Send Button */}
            <button 
              type="submit" 
              className="bg-indigo-600 text-white p-2 rounded-r-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;