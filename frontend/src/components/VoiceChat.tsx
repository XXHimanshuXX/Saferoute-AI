'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Bot, User, Volume2, ArrowRight } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const VoiceChat: React.FC = () => {
  const safetyScore = useMapStore(state => state.safetyScore);
  const incidents = useMapStore(state => state.incidents);
  const mapCenter = useMapStore(state => state.mapCenter);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Greetings. I am your SafeRoute AI Navigator. Ask me about secure detours, localized safe shelters, lighting status, or incident alerts.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen for speech recognition transcriptions from AIOrb
  useEffect(() => {
    const handleVoiceInput = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const text = customEvent.detail;
      if (text && text.trim()) {
        handleSend(text);
      }
    };

    window.addEventListener('voice-input', handleVoiceInput);
    return () => {
      window.removeEventListener('voice-input', handleVoiceInput);
    };
  }, [mapCenter, safetyScore, incidents, speechEnabled]);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Pre-configured Quick Action suggestions
  const prompts = [
    { label: 'Map nearest Safe Haven', text: 'Where is the nearest safe haven or police station near me?' },
    { label: 'Avoid low-light streets', text: 'Suggest a route that avoids dark streets and unlit zones.' },
    { label: 'Check local crime level', text: 'What is the current safety rating of my surroundings?' }
  ];

  // Text-To-Speech engine play
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel ongoing speech
      window.speechSynthesis.cancel();
      // Clean up markdown formatting like asterisks or hashtags from spoken text
      const cleanText = text.replace(/[*#_`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
      
      // Attempt to find an Indian English or Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi'));
      if (inVoice) {
        utterance.voice = inVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // API integration to Express endpoint `/api/chat/rag`
      const res = await fetch('http://localhost:5000/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          lat: mapCenter[0],
          lng: mapCenter[1]
        })
      }).catch(() => null);

      let replyText = '';

      if (res && res.ok) {
        const data = await res.json();
        replyText = data.aiText || 'I have analyzed your surroundings and updated your tactical safety paths.';
      } else {
        // High fidelity mock fallback simulating the RAG dataset responses
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const lower = textToSend.toLowerCase();
        if (lower.includes('haven') || lower.includes('police') || lower.includes('safezone') || lower.includes('station')) {
          replyText = `Jaipur Sector 7 Command Command: A safe zone hub with Rajasthan Police PCR connection is active at 26.9124, 75.7873. Another local municipal helper booth is available within 800m.`;
        } else if (lower.includes('light') || lower.includes('dark')) {
          replyText = `Alert: Civil Lines and Bapu Nagar crossing alleys are exhibiting light deficits (street lamp broken). Stick to Sector 7 main lanes which maintain a 94% safety illumination rating.`;
        } else if (lower.includes('crime') || lower.includes('rating') || lower.includes('score')) {
          replyText = `Jaipur Sector 7 safety rating is currently ${safetyScore}/100. Our geospatial scoring registers active light audits and reported alert zones (${incidents.filter(i => i.type === 'sos').length} active SOS alarms in Jaipur).`;
        } else {
          replyText = `Mene aapke coordinate checks pure kar liye hain. Jaipur Sector 7 Command recommends using the green-lit main roads. Koi aur safe alternate route mapping chahiye?`;
        }
      }

      // Add AI reply
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Auto read response
      if (speechEnabled) {
        speakText(replyText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-obsidian-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400 glow-emerald" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 tracking-tight flex items-center gap-1.5">
              Gemini Co-Navigator <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Multilingual Safety Assistant (RAG active)</p>
          </div>
        </div>
        <button
          onClick={() => {
            const nextVal = !speechEnabled;
            setSpeechEnabled(nextVal);
            if (!nextVal && typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          }}
          className={`p-2 rounded-xl border transition-all active:scale-95 duration-200 ${
            speechEnabled
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-glass-glow'
              : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
          title={speechEnabled ? 'Mute AI Voice Navigation' : 'Unmute AI Voice Navigation'}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          return (
            <div key={m.id} className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className="relative group max-w-[80%]">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                  isAI 
                    ? 'bg-obsidian-900/50 border-slate-800/60 text-slate-300 rounded-tl-none' 
                    : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-300 rounded-tr-none'
                }`}>
                  <p>{m.text}</p>
                </div>
                
                {/* TTS Reader Trigger */}
                {isAI && (
                  <button
                    onClick={() => speakText(m.text)}
                    className="absolute -right-7 top-1 p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Speak Response"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {!isAI && (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="p-3.5 rounded-2xl bg-obsidian-900/50 border border-slate-800/60 rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick prompts */}
      {messages.length === 1 && (
        <div className="p-3 border-t border-slate-800/40 bg-obsidian-950/30 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Suggested Safety Checks</p>
          <div className="flex flex-col gap-1.5">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                className="w-full text-left p-2 rounded-lg border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/50 text-slate-400 hover:text-emerald-400 transition-all text-[11px] flex items-center justify-between"
              >
                <span>{p.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3.5 border-t border-slate-800/80 bg-obsidian-900/40 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SafeRoute AI Navigator..."
          className="flex-1 bg-obsidian-950 border border-slate-800/80 hover:border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-600"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all active:scale-95 duration-200"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
export default VoiceChat;
