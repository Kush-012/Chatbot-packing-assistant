const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const port = 3000;

// Replace with your actual API key
const API_KEY = 'AIzaSyB_eeE9Z_fkD5BSGMDqinu93kBYIfnLSOU';
const genAI = new GoogleGenerativeAI(API_KEY);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Endpoint to handle chat messages
app.post('/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log('Received message:', message); // Log the input
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        // Process specific destination queries intelligently
        let specificPrompt = "";
        const lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.includes('kedarnath') || lowercaseMessage.includes('cold') || lowercaseMessage.includes('adventure') || lowercaseMessage.includes('trek')) {
            specificPrompt = `The user is asking about a trip that might involve cold weather, trekking, or adventure. 
            If they mention a specific location (like Kedarnath), duration, or temperature, create a detailed packing list
            tailored specifically to those conditions. Include categories for clothing, gear, essentials, and safety items.
            Consider altitude, weather, and activity level in your recommendations.`;
        } else if (lowercaseMessage.includes('beach') || lowercaseMessage.includes('summer') || lowercaseMessage.includes('tropical')) {
            specificPrompt = `The user is asking about a beach or summer vacation. If they mention specific
            destinations, duration, or activities, create a tailored packing list focusing on warm weather
            essentials, sun protection, swimwear, and any specific items needed for the mentioned activities.`;
        }
        
        // Define training examples for the packing assistant
        const trainingExamples = [
            { input: "Who are you?", output: "I am a Smart Packing assistant 🧳" },
            { input: "Hello", output: "Hi there! How can I assist you with your packing today?" },
            { input: "Hi", output: "Hi there! How can I assist you with your packing today?" },
            { input: "Can I travel with you?", output: "Of course! I can be your smart travel buddy, helping you pack like a pro! 😊 ✈️" },
            { input: "Hi, can you help me pack?", output: "Sure! Let me know your destination, duration, and any specific needs." },
            { input: "Thanks", output: "You're welcome! 😊 Have a fantastic trip and let me know if you need more help! ✈️ 🧳" },
            { input: "kedarnath for 2 days adventure 0 degree celcius", output: "Here's your packing list for a 2-day adventure to Kedarnath in 0°C weather:\n\n**Essential Clothing:**\n* Thermal base layers (2 sets)\n* Fleece jacket or heavyweight sweater\n* Insulated down jacket\n* Waterproof/windproof outer shell\n* Hiking pants (preferably water-resistant)\n* Warm hiking socks (3-4 pairs)\n* Waterproof hiking boots (well broken-in)\n* Warm hat, gloves, and neck gaiter/scarf\n* Thermal underwear for sleeping\n\n**Trekking Gear:**\n* Trekking poles\n* Backpack (30-40L) with rain cover\n* Headlamp with extra batteries\n* Sunglasses (UV protection)\n* Water bottles (2L capacity total)\n* Small daypack for the temple visit\n\n**Personal Items:**\n* Sunscreen (high SPF)\n* Lip balm with SPF\n* Personal medications\n* First aid kit with blister treatment\n* Hand and toe warmers\n* Quick-dry towel\n* Power bank for devices\n* ID and cash (ATMs are limited)\n\n**Food & Hydration:**\n* Energy bars and trail mix\n* Electrolyte powder/tablets\n* Thermos for hot beverages\n\nRemember that Kedarnath is at high altitude (3,583m), so pack light but warm. Would you like additional advice on altitude sickness prevention?" }
        ];
        
        // Format examples for the prompt
        let examplesText = "";
        trainingExamples.forEach((example, i) => {
            examplesText += `Example ${i+1}:\nInput: ${example.input}\nOutput: ${example.output}\n\n`;
        });
        
        // Format conversation history if provided
        let conversationHistory = "";
        if (history && Array.isArray(history) && history.length > 0) {
            // Include up to the last 5 exchanges to avoid token limit issues
            const recentHistory = history.slice(-10);
            
            conversationHistory = "Previous conversation:\n";
            recentHistory.forEach(msg => {
                conversationHistory += msg.isUser 
                    ? `User: ${msg.text}\n` 
                    : `PackPal: ${msg.text}\n`;
            });
            conversationHistory += "\n";
        }
        
        // Create system prompt
        const systemPrompt = `You are a smart packing assistant, specialized in helping users prepare for trips.
        Your role is to provide helpful packing advice, create packing lists, and answer questions about travel essentials.
        Use a friendly, helpful tone and provide practical advice. Include relevant emojis like ✈️ and 🧳 where appropriate.
        Always analyze the user's request carefully to detect destination, duration, weather, and purpose of trip.
        When these details are provided, give specific, tailored advice instead of asking for information again.
        ${specificPrompt}
        
        ${conversationHistory}
        
        Here are examples of how you should respond: ${examplesText}
        
        User message: ${message}`;
        
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        console.log('Generated response:', text); // Log the output
        
        res.json({ response: text });
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 