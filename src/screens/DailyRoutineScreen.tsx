import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Brain, 
  Target, 
  ClipboardList, 
  Sparkles, 
  ChevronRight,
  Loader2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { auth, db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DailyRoutineScreenProps {
  userData: any;
}

interface QuizQuestion {
  question: string;
  isAnswered: boolean;
  answer: boolean | null;
}

interface HealthTarget {
  target: string;
  isCompleted: boolean;
}

interface ActionableHabit {
  habit: string;
  isCompleted: boolean;
}

interface RoutineData {
  quiz: QuizQuestion[];
  targets: HealthTarget[];
  tasks: ActionableHabit[];
}

export default function DailyRoutineScreen({ userData }: DailyRoutineScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (userData?.uid) {
      loadDailyRoutine();
    }
  }, [userData?.uid]);

  const loadDailyRoutine = async () => {
    setLoading(true);
    const routineRef = doc(db, 'users', userData.uid, 'daily_routines', today);
    try {
      const routineSnap = await getDoc(routineRef);

      if (routineSnap.exists()) {
        const data = routineSnap.data();
        setRoutine({
          quiz: data.quiz || [],
          targets: data.targets || [],
          tasks: data.tasks || []
        });
        setProgress(data.progress || 0);
        setStreak(data.streak || 0);
      } else {
        // Generate new routine for today
        await generateAndSaveRoutine();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, routineRef.path);
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveRoutine = async () => {
    const routinesColRef = collection(db, 'users', userData.uid, 'daily_routines');
    try {
      // Calculate streak
      const lastRoutineQuery = query(
        routinesColRef,
        orderBy('date', 'desc'),
        limit(1)
      );
      const lastRoutineSnap = await getDocs(lastRoutineQuery);
      
      let currentStreak = 0;
      if (!lastRoutineSnap.empty) {
        const lastData = lastRoutineSnap.docs[0].data();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastData.date === yesterday.toISOString().split('T')[0]) {
          currentStreak = lastData.isCompleted ? lastData.streak : 0;
        } else if (lastData.date === today) {
          currentStreak = lastData.streak;
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Generate a personalized Ayurvedic daily routine for today. Output ONLY a JSON object with fields: quiz (list of 3 simple yes/no questions), targets (list of 3 health goals), and tasks (list of 3 actionable habits). Keep it simple, practical, and beginner-friendly.",
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newRoutine: RoutineData = {
        quiz: (data.quiz || []).map((q: string) => ({ question: q, isAnswered: false, answer: null })),
        targets: (data.targets || []).map((t: string) => ({ target: t, isCompleted: false })),
        tasks: (data.tasks || []).map((h: string) => ({ habit: h, isCompleted: false }))
      };

      const routineRef = doc(db, 'users', userData.uid, 'daily_routines', today);
      await setDoc(routineRef, {
        uid: userData.uid,
        date: today,
        ...newRoutine,
        progress: 0,
        streak: currentStreak,
        isCompleted: false,
        createdAt: serverTimestamp()
      });

      setRoutine(newRoutine);
      setProgress(0);
      setStreak(currentStreak);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, routinesColRef.path);
    }
  };

  const saveProgress = async (updatedRoutine: RoutineData) => {
    if (!userData?.uid || isSaving) return;
    setIsSaving(true);
    
    const total = updatedRoutine.quiz.length + updatedRoutine.targets.length + updatedRoutine.tasks.length;
    const completed = 
      updatedRoutine.quiz.filter(q => q.isAnswered).length +
      updatedRoutine.targets.filter(t => t.isCompleted).length +
      updatedRoutine.tasks.filter(h => h.isCompleted).length;
    
    const newProgress = Math.round((completed / total) * 100);
    const isCompleted = newProgress === 100;
    
    // Update streak if just completed 100%
    let finalStreak = streak;
    if (isCompleted && progress < 100) {
      finalStreak += 1;
      setStreak(finalStreak);
    }

    const routineRef = doc(db, 'users', userData.uid, 'daily_routines', today);
    try {
      await updateDoc(routineRef, {
        ...updatedRoutine,
        progress: newProgress,
        isCompleted,
        streak: finalStreak
      });
      setProgress(newProgress);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, routineRef.path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizAnswer = (index: number, answer: boolean) => {
    if (!routine) return;
    const newRoutine = { ...routine };
    newRoutine.quiz[index].isAnswered = true;
    newRoutine.quiz[index].answer = answer;
    setRoutine(newRoutine);
    saveProgress(newRoutine);
  };

  const toggleTarget = (index: number) => {
    if (!routine) return;
    const newRoutine = { ...routine };
    newRoutine.targets[index].isCompleted = !newRoutine.targets[index].isCompleted;
    setRoutine(newRoutine);
    saveProgress(newRoutine);
  };

  const toggleTask = (index: number) => {
    if (!routine) return;
    const newRoutine = { ...routine };
    newRoutine.tasks[index].isCompleted = !newRoutine.tasks[index].isCompleted;
    setRoutine(newRoutine);
    saveProgress(newRoutine);
  };

  const handleBodyScanAccess = async () => {
    if (userData.wallet_balance < 20) {
      navigate('/wallet', { state: { message: "Insufficient balance. Please recharge ₹20 to unlock AI Body Scan." } });
      return;
    }

    // Deduct ₹20
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        wallet_balance: userData.wallet_balance - 20
      });
      
      // Record transaction
      const transRef = doc(collection(db, 'transactions'));
      await setDoc(transRef, {
        uid: userData.uid,
        amount: 20,
        type: 'payment',
        status: 'success',
        description: 'AI Body Scan Payment',
        createdAt: serverTimestamp()
      });

      navigate('/body-scan');
    } catch (error) {
      console.error("Error deducting from wallet:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
        <h2 className="text-xl font-black text-gray-900">Preparing Your Routine...</h2>
        <p className="text-gray-500 text-sm mt-2">Our Ayurvedic AI is crafting your personalized health plan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Daily Ayur Routine</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personalized Plan</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-100/50"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Progress</p>
              <h2 className="text-3xl font-black text-gray-900">{progress}%</h2>
            </div>
            <div className="text-right">
              <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 mb-2">
                <Zap className="w-3 h-3" />
                {streak} DAY STREAK 🔥
              </div>
              <p className="text-xs font-bold text-[#22C55E] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {progress === 100 ? 'Great job!' : 'Keep it up!'}
              </p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#22C55E] transition-all duration-500"
            />
          </div>
          <p className="text-xs text-gray-500 font-medium mt-4">
            {progress === 100 
              ? "You've completed your routine for today! 🌿" 
              : "Complete your routine to improve your health 🌿"}
          </p>
        </motion.div>

        {/* Quiz Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Daily Quiz</h3>
          </div>
          <div className="space-y-3">
            {routine?.quiz.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-4">{q.question}</p>
                <div className="flex gap-3">
                  <button
                    disabled={q.isAnswered}
                    onClick={() => handleQuizAnswer(i, true)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      q.isAnswered && q.answer === true 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                        : q.isAnswered 
                          ? 'bg-gray-50 text-gray-300' 
                          : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    disabled={q.isAnswered}
                    onClick={() => handleQuizAnswer(i, false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      q.isAnswered && q.answer === false 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                        : q.isAnswered 
                          ? 'bg-gray-50 text-gray-300' 
                          : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Targets Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Target className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Daily Targets</h3>
          </div>
          <div className="space-y-3">
            {routine?.targets.map((t, i) => (
              <button
                key={i}
                onClick={() => toggleTarget(i)}
                className={`w-full flex items-center gap-4 bg-white rounded-2xl p-5 border transition-all text-left ${
                  t.isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                }`}
              >
                {t.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-200" />
                )}
                <span className={`text-sm font-bold ${t.isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                  {t.target}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Daily Tasks</h3>
          </div>
          <div className="space-y-3">
            {routine?.tasks.map((h, i) => (
              <button
                key={i}
                onClick={() => toggleTask(i)}
                className={`w-full flex items-center gap-4 bg-white rounded-2xl p-5 border transition-all text-left ${
                  h.isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                }`}
              >
                {h.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-200" />
                )}
                <span className={`text-sm font-bold ${h.isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                  {h.habit}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Monetization CTA */}
        <AnimatePresence>
          {progress >= 40 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`rounded-[2rem] p-6 border shadow-xl transition-all duration-500 ${
                progress >= 100 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-green-100/50'
                  : progress >= 60
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 shadow-amber-100/50'
                    : 'bg-white border-gray-100 shadow-gray-100/50'
              }`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm ${
                  progress >= 100 ? 'text-green-500' : 'text-amber-500'
                }`}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-gray-900 tracking-tight">
                    {progress >= 100 
                      ? "Great job! Enhance results with AI Scan" 
                      : progress >= 60 
                        ? "Unlock AI Body Scan (₹20)" 
                        : "Want deeper insight?"}
                  </h4>
                  <p className="text-sm text-gray-600 font-medium">
                    {progress >= 100
                      ? "You've mastered today's routine. Now get a visual AI analysis of your physical markers."
                      : "Try our AI Body Scan for a complete Ayurvedic profile based on physical markers."}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleBodyScanAccess}
                className={`w-full text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                  progress >= 100
                    ? 'bg-[#22C55E] shadow-green-200'
                    : 'bg-amber-500 shadow-amber-200'
                }`}
              >
                {progress >= 100 ? 'Start AI Body Scan' : 'Unlock AI Body Scan (₹20)'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
