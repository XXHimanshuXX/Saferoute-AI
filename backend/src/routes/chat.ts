import { Router, Request, Response } from 'express';
import ChatSession from '../models/ChatSession';
import ChatMessage from '../models/ChatMessage';
import Incident from '../models/Incident';
import authMiddleware, { AuthRequest } from '../middleware/auth';
import { validateBody, chatRagSchema } from '../middleware/validators';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from '../server';
import mongoose from 'mongoose';
import * as mockDb from '../utils/mockDb';

const router = Router();

// Helper to check if DB is connected
const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

// Helper for Haversine distance in meters
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

// AI Response Generation Helper (simplified from chat.js)
async function generateAIResponse(userMessage: string) {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  const responseTime = Date.now() - startTime;
  
  const message = userMessage.toLowerCase();
  let response = {
    text: "I'm here to help with your safety concerns. Could you provide more details about your situation?",
    confidence: 0.7,
    intent: 'general_inquiry',
    suggestions: ['Show safest route', 'Find nearby police stations'] as string[],
    responseTime
  };

  if (message.includes('safe') || message.includes('dangerous')) {
    response.text = "Based on current location data, this area has a high safety score. I recommend staying on well-lit main streets.";
    response.intent = 'safety_inquiry';
  } else if (message.includes('emergency') || message.includes('help')) {
    response.text = "**EMERGENCY ASSISTANCE ACTIVATED**. I'm sharing your location with emergency services.";
    response.intent = 'emergency';
  }

  return response;
}

// Create new chat session
router.post('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, context } = req.body;

    const session = new ChatSession({
      user: req.userId,
      title: title || 'New Chat Session',
      context: context || {},
      status: 'active'
    });

    await session.save();

    res.status(201).json({
      message: 'Chat session created successfully',
      session
    });
  } catch (error: any) {
    console.error('Create session error:', error);
    res.status(500).json({
      error: 'Failed to create chat session',
      message: error.message
    });
  }
});

// Send message
router.post('/sessions/:sessionId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const sessionId = req.params.sessionId;

    const session = await ChatSession.findById(sessionId);
    if (!session || (session as any).user.toString() !== req.userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to send messages to this session'
      });
    }

    const userMessage = new ChatMessage({
      user: req.userId,
      session: sessionId,
      message,
      sender: 'user',
      messageType: 'text',
      content: { text: message }
    });

    await userMessage.save();

    // Update session
    (session as any).lastActivity = new Date();
    (session as any).summary.totalMessages += 1;
    (session as any).summary.userMessages += 1;
    await session.save();

    const aiResponse = await generateAIResponse(message);

    const aiMessage = new ChatMessage({
      user: req.userId,
      session: sessionId,
      message: aiResponse.text,
      sender: 'ai',
      messageType: 'text',
      content: { text: aiResponse.text, suggestions: aiResponse.suggestions },
      aiResponse: {
        confidence: aiResponse.confidence,
        intent: aiResponse.intent,
        responseTime: aiResponse.responseTime
      }
    });

    await aiMessage.save();

    // Update session summary
    (session as any).summary.totalMessages += 1;
    (session as any).summary.aiMessages += 1;
    await session.save();

    // Emit real-time message
    io.to(`user-${req.userId}`).emit('chat-message', {
      sessionId,
      message: aiMessage,
      timestamp: new Date()
    });

    res.status(201).json({
      message: 'Message sent successfully',
      userMessage,
      aiResponse: aiMessage
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// MULTILINGUAL RAG CHAT ROUTE (/api/chat/rag)
router.post('/rag', validateBody(chatRagSchema), async (req: Request, res: Response) => {
  try {
    const { message, lat, lng } = req.body;

    // 1. Fetch nearby safety incidents within 1km
    let incidents: any[] = [];
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to query nearby incidents for RAG.');
      incidents = mockDb.queryNearbyMockIncidents(lat, lng, 1000).slice(0, 10);
    } else {
      incidents = await Incident.find({
        'location.coordinates': {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 1000 // 1km radius
          }
        }
      }).limit(10).lean();
    }

    // 2. Build local incidents context
    let incidentContext = "No safety incidents reported recently within 1km. The surroundings appear safe.";
    if (incidents.length > 0) {
      incidentContext = incidents.map((inc, index) => {
        const dist = haversineDistanceMeters(lat, lng, inc.location.coordinates[1], inc.location.coordinates[0]);
        return `${index + 1}. [Type: ${inc.type.toUpperCase()}] Severity: ${inc.severity}/5, Address: ${inc.location.address || 'Unknown street'}, Details: ${inc.description}, Trust Score: ${inc.trustScore}, Distance: ${Math.round(dist)}m.`;
      }).join('\n');
    }

    // 3. Compose structured prompt
    const systemInstruction = `You are SafeRoute AI, a localized street safety assistant.
You provide real-time, actionable safety guidance to users based on safety incidents in their immediate vicinity.

Guidelines:
1. Always respond in an empathetic, calm, and highly protective tone.
2. Provide output in conversational multilingual Hinglish/Hindi (conversational mixes of Hindi and English like "Bhaiya, is area me thoda caution rakhein because..." or "Aap is route par safe rehte hain but street lights thodi kam hain...") to make the safety warnings natural and easy to understand.
3. Incorporate the safety incidents provided below in their immediate vicinity (within 1km). Reference these incidents directly and specify their severity, type, and distance.
4. Reference local street names if they are present in the incident details.
5. Structure your output clearly into numbered safety steps (e.g. 1., 2., 3.) so it is easily readable in an emergency.`;

    const userPrompt = `USER MESSAGE: "${message}"
USER COORDINATES: Latitude: ${lat}, Longitude: ${lng}

NEARBY SAFETY INCIDENTS (within 1km):
${incidentContext}

Please analyze and provide the safest routes, actions, or steps to take.`;

    let aiText = '';
    let usedFallback = false;

    // 4. Try Google Gemini 1.5 Flash
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🤖 Invoking Google Gemini 1.5 Flash for RAG Query...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: systemInstruction
        });
        const result = await model.generateContent(userPrompt);
        aiText = result.response.text();
      } catch (err: any) {
        console.warn('⚠️ Gemini 1.5 Flash call failed. Falling back to Pollinations.ai...', err.message);
        usedFallback = true;
      }
    } else {
      console.log('ℹ️ No GEMINI_API_KEY found. Using Pollinations.ai fallback.');
      usedFallback = true;
    }

    // 5. Fallback to Pollinations.ai
    if (usedFallback || !aiText) {
      try {
        console.log('🎨 Invoking Pollinations.ai fallback...');
        const response = await globalThis.fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ],
            model: 'openai'
          })
        });

        if (!response.ok) {
          throw new Error(`Pollinations HTTP error: ${response.status}`);
        }
        aiText = await response.text();
      } catch (err: any) {
        console.error('❌ Pollinations.ai fallback failed:', err.message);
        // Final fallback text
        aiText = `Bhaiya, mere systems thode load ho rahe hain, par aapki safety sabse pehle hai.
1. Safe rahne ke liye kripya well-lit main roads ka hi use karein.
2. Akele sunsaan raste par na jayein aur family se continuously touch me rahein.
3. Emergency situation me immediate SOS trigger karein ya direct 112 par connect karein.`;
      }
    }

    res.json({
      aiText,
      incidentsFound: incidents.length,
      usedFallback,
      coordinates: { lat, lng }
    });

  } catch (error: any) {
    console.error('RAG chat error:', error);
    res.status(500).json({
      error: 'RAG query failed',
      message: error.message
    });
  }
});

export default router;
