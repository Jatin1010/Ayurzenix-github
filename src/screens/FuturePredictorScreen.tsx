import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wallet, AlertCircle, Loader2, ChevronLeft, Sparkles, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { analyzeFutureHealth } from '../lib/gemini';

interface FuturePredictorScreenProps {
  userData: any;
}

export default function FuturePredictorScreen({ userData }: FuturePredictorScreenProps) {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);

  const COST = 29;

  useEffect(() => {
    const fetchRecentData = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, 'health_profiles'),
          where('uid', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        setRecentProfiles(snap.docs.map(doc => doc.data()));
      } catch (err) {
        console.error("Error fetching recent data:", err);
      }
    };
    fetchRecentData();
  }, [userData?.uid]);

  const startPrediction = async () => {
    const isDeveloper = userData?.email === 'Help@ayurzenix.in';
    
    if (!isDeveloper && (userData?.wallet_balance || 0) < COST) {
      setError(`Insufficient balance. Please recharge your wallet with at least ₹${COST}.`);
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // 1. Deduct from wallet (Skip for developer)
      const userRef = doc(db, 'users', userData.uid);
      if (!isDeveloper) {
        await updateDoc(userRef, {
          wallet_balance: increment(-COST)
        });
      }

      // 2. Analyze with Gemini
      const result = await analyzeFutureHealth({
        ...userData,
        recentProfiles
      }, userData.language || 'en');

      // 3. Save to health_profiles
      await addDoc(collection(db, 'health_profiles'), {
        uid: userData.uid,
        type: 'future_prediction',
        analysis: result,
        createdAt: serverTimestamp()
      });

      setPrediction(result);
    } catch (err: any) {
      console.error("Prediction Error:", err);
      setError("Failed to generate prediction. Please try again.");
      // Refund if analysis failed (Skip for developer)
      const isDeveloper = userData?.email === 'Help@ayurzenix.in';
      if (!isDeveloper) {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, {
          wallet_balance: increment(COST)
        });
      }
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
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Health Predictor</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-8">
        {!prediction ? (
          <>
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calendar className="w-32 h-32 rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  AI Forecasting
                </div>
                <h2 className="text-3xl font-black leading-tight">Predict Your Next 30 Days</h2>
                <p className="text-sm font-medium text-white/80 leading-relaxed">
                  Our AI analyzes your lifestyle, sleep patterns, and recent health scans to predict potential risks and wellness opportunities.
                </p>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Wallet Balance</p>
                  <p className="text-lg font-black text-gray-900">₹{userData?.wallet_balance || 0}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/wallet')}
                className="bg-white text-amber-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-amber-100"
              >
                RECHARGE
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-900">Action Required</p>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Button */}
            <button
              disabled={analyzing}
              onClick={startPrediction}
              className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                analyzing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white shadow-indigo-200 active:scale-95'
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Predicting Future...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Get 30-Day Prediction (₹{COST})
                </>
              )}
            </button>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">What's included</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: <ShieldAlert className="text-rose-500" />, text: "Risk identification for next 30 days" },
                  { icon: <Calendar className="text-blue-500" />, text: "Weekly wellness focus points" },
                  { icon: <Sparkles className="text-amber-500" />, text: "Personalized Ayurvedic remedies" },
                  { icon: <CheckCircle2 className="text-green-500" />, text: "Actionable lifestyle changes" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Prediction Results */}
            <div className={`p-8 rounded-[2.5rem] text-white shadow-xl ${
              prediction.riskLevel === 'High' ? 'bg-rose-600 shadow-rose-100' :
              prediction.riskLevel === 'Medium' ? 'bg-amber-500 shadow-amber-100' :
              'bg-green-600 shadow-green-100'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Risk Level: {prediction.riskLevel}
                  </div>
                  <TrendingUp className="w-6 h-6 opacity-50" />
                </div>
                <h2 className="text-2xl font-black leading-tight">{prediction.outlook}</h2>
              </div>
            </div>

            {/* Weekly Predictions */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-gray-900 tracking-tight px-2">30-Day Timeline</h3>
              <div className="space-y-4">
                {prediction.predictions.map((p: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-lg shadow-gray-100/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.period}</span>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-gray-900">{p.focus}</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{p.risk}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Recommended Remedy</p>
                      <p className="text-xs text-green-800 font-bold">{p.remedy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings & Actions */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 space-y-4">
                <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Key Warnings
                </h4>
                <ul className="space-y-3">
                  {prediction.keyWarnings.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-rose-800 font-bold leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-[2rem] p-8 space-y-4">
                <h4 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Recommended Actions
                </h4>
                <ul className="space-y-3">
                  {prediction.recommendedActions.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-green-800 font-bold leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setPrediction(null)}
              className="w-full py-5 rounded-[2rem] border-2 border-gray-100 font-black text-sm uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
            >
              Get New Prediction
            </button>
          </motion.div>
        )}

        {/* Safety Disclaimer */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed text-center uppercase tracking-widest">
            Disclaimer: Future health predictions are based on AI analysis of your current data and Ayurvedic principles. They are not medical diagnoses. Always consult a doctor for health concerns.
          </p>
        </div>
      </div>
    </div>
  );
}
