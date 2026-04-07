import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Sparkles, Coffee, Zap, Wind, Heart, Brain, Moon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeMoodAyurveda } from '../lib/gemini';

interface MoodAyurvedaScreenProps {
  userData: any;
}

export default function MoodAyurvedaScreen({ userData }: MoodAyurvedaScreenProps) {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [remedy, setRemedy] = useState<any>(null);

  const moods = [
    { id: 'stressed', emoji: '😰', label: 'Stressed', color: 'bg-rose-50 text-rose-600', icon: <Wind className="w-5 h-5" /> },
    { id: 'angry', emoji: '😡', label: 'Angry', color: 'bg-orange-50 text-orange-600', icon: <Zap className="w-5 h-5" /> },
    { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-blue-50 text-blue-600', icon: <Moon className="w-5 h-5" /> },
    { id: 'anxious', emoji: '😟', label: 'Anxious', color: 'bg-purple-50 text-purple-600', icon: <Brain className="w-5 h-5" /> },
    { id: 'calm', emoji: '😌', label: 'Calm', color: 'bg-green-50 text-green-600', icon: <Heart className="w-5 h-5" /> },
    { id: 'happy', emoji: '😊', label: 'Happy', color: 'bg-amber-50 text-amber-600', icon: <Sparkles className="w-5 h-5" /> }
  ];

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    setAnalyzing(true);
    try {
      const result = await analyzeMoodAyurveda(moodId, userData.language || 'en');
      setRemedy(result);
    } catch (err) {
      console.error("Mood Analysis Error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Mood Engine</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-8">
        {!remedy ? (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 leading-tight">How are you feeling right now?</h2>
              <p className="text-sm text-gray-500 font-medium">Select your current mood for an Ayurvedic remedy.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {moods.map((mood) => (
                <motion.button
                  key={mood.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMoodSelect(mood.id)}
                  disabled={analyzing}
                  className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 transition-all ${
                    selectedMood === mood.id 
                      ? 'border-[#22C55E] bg-green-50 shadow-lg shadow-green-50' 
                      : 'border-gray-50 bg-white hover:border-gray-100'
                  }`}
                >
                  <span className="text-5xl">{mood.emoji}</span>
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{mood.label}</span>
                </motion.button>
              ))}
            </div>

            {analyzing && (
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-8 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />
                <div className="space-y-1">
                  <p className="text-lg font-black text-gray-900 uppercase tracking-widest">Finding Balance...</p>
                  <p className="text-xs text-gray-500 font-medium">Analyzing your mood through Ayurvedic principles</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Remedy Hero */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-[2.5rem] p-10 text-white shadow-xl shadow-green-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 rotate-12" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Mood: {selectedMood}
                </div>
                <h2 className="text-3xl font-black leading-tight">{remedy.remedy}</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                  <Info className="w-4 h-4" />
                  {remedy.doshaImpact}
                </div>
              </div>
            </div>

            {/* Drink & Activity */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex items-start gap-6">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Coffee className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Recommended Drink</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">{remedy.drink}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 flex items-start gap-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Recommended Activity</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">{remedy.activity}</p>
                </div>
              </div>
            </div>

            {/* Diet Suggestions */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/50 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Diet for Balance</h3>
              </div>
              <ul className="space-y-4">
                {remedy.diet.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-gray-600 font-bold leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setRemedy(null)}
              className="w-full py-5 rounded-[2rem] border-2 border-gray-100 font-black text-sm uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
            >
              Select Another Mood
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
