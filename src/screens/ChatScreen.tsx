import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MessageSquare, Send, Loader2, User, Bot, Sparkles, AlertCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! 🙏 I am your Ayurvedic AI Assistant, **Ayurzenix**. How can I help you achieve balance today? ✨' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponseCount, setAiResponseCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: `You are an expert Ayurvedic AI Assistant named Ayurzenix. 
          
          CRITICAL STYLE RULES:
          1. NEVER use asterisks (*) or dashes (-) for bullet points or lists. 
          2. ALWAYS use relevant emojis as bullet points (e.g., 🌿, ✨, 🧘, 🥗, 💧).
          3. DO NOT use markdown list syntax (like * or -). Just start lines with an emoji.
          4. Use bold text (**text**) ONLY for very important terms.
          5. Keep responses well-summarized, engaging, and visually "beautiful" using spacing and emojis.
          6. Provide helpful, friendly, and safe Ayurvedic advice.
          7. ALWAYS add a small disclaimer at the end: "⚠️ *Disclaimer: I am an AI assistant, not a doctor. Please consult a professional for medical concerns.*"
          8. If the user asks in Hindi, respond in Hindi with appropriate emojis.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const aiText = response.text || 'I apologize, I could not process that.';
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      
      const newCount = aiResponseCount + 1;
      setAiResponseCount(newCount);
      
      if (newCount >= 2) {
        setShowLimitPopup(true);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again. 🛑' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#FDFCFB] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22C55E 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
              Ayurzenix
              <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Always Here to Help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[90%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                m.role === 'user' ? "bg-green-500 text-white" : "bg-white border border-gray-100 text-gray-400"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-sm max-w-none transition-all",
                m.role === 'user' 
                  ? "bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white rounded-tr-none shadow-green-100" 
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm"
              )}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="m-0 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className={m.role === 'user' ? "text-white font-black" : "text-green-700 font-bold"}>{children}</strong>,
                    ul: ({ children }) => <ul className="list-none p-0 m-0 space-y-2 mt-2">{children}</ul>,
                    li: ({ children }) => <li className="flex items-start gap-2 m-0">{children}</li>
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%] mr-auto"
          >
            <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto">
          <div className="relative group">
            <input
              disabled={showLimitPopup}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={showLimitPopup ? "Limit reached. Please recharge." : "Ask Ayurzenix about your health..."}
              className="w-full pl-5 pr-14 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all shadow-inner disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || showLimitPopup}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#22C55E] text-white rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            🌿 Ayurzenix provides wellness guidance based on Ayurvedic principles.
          </p>
        </form>
      </div>

      {/* Limit Popup */}
      <AnimatePresence>
        {showLimitPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border border-green-50"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Prescription Limit!</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                You've reached your free chat limit for this session. Recharge your wallet to continue getting personalized Ayurvedic insights. 🌿
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/wallet')}
                  className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
                >
                  <Wallet className="w-5 h-5" />
                  Recharge Now
                </button>
                <button
                  onClick={() => setShowLimitPopup(false)}
                  className="w-full py-3 text-gray-400 text-sm font-bold hover:text-gray-600 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
