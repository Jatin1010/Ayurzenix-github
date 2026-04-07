import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Camera, 
  MessageCircle, 
  Sparkles, 
  Wallet, 
  ChevronRight, 
  Leaf,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

interface HomeScreenProps {
  userData: any;
}

export default function HomeScreen({ userData }: HomeScreenProps) {
  const navigate = useNavigate();
  const [dailyProgress, setDailyProgress] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (userData?.uid) {
      fetchDailyStats();
    }
  }, [userData?.uid]);

  const fetchDailyStats = async () => {
    const routineRef = doc(db, 'users', userData.uid, 'daily_routines', today);
    try {
      const routineSnap = await getDoc(routineRef);
      if (routineSnap.exists()) {
        const data = routineSnap.data();
        setDailyProgress(data.progress || 0);
        setDailyStreak(data.streak || 0);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, routineRef.path);
    }
  };

  if (!userData) return null;

  const features = [
    {
      id: 'face-glow',
      title: '🪞 Face Glow Analyzer',
      description: 'AI-powered skin analysis for glow, hydration, and Ayurvedic care.',
      icon: <Sparkles className="w-6 h-6" />,
      cta: 'Analyze Glow',
      price: '₹20',
      gradient: 'from-amber-50 to-rose-50',
      textColor: 'text-rose-900',
      descColor: 'text-rose-700/80',
      ctaColor: 'text-rose-600',
      iconBg: 'bg-rose-100 text-rose-600',
      path: '/face-glow',
      premium: true,
      badge: '🔥 Trending',
      glow: true
    },
    {
      id: 'health-scan',
      title: 'Smart Health Scan',
      description: 'AI-powered Ayurvedic analysis based on your symptoms.',
      icon: <Brain className="w-6 h-6" />,
      cta: 'Start Scan',
      price: '₹10',
      gradient: 'from-green-50 to-yellow-50',
      textColor: 'text-green-900',
      descColor: 'text-green-700/80',
      ctaColor: 'text-[#22C55E]',
      iconBg: 'bg-green-100 text-green-600',
      path: '/health-scan'
    },
    {
      id: 'body-scan',
      title: 'AI Body Scan',
      description: 'Visual AI analysis for skin, tongue, and physical markers.',
      icon: <Camera className="w-6 h-6" />,
      cta: 'Scan Now',
      price: '₹20',
      gradient: 'from-amber-50 to-orange-50',
      textColor: 'text-amber-900',
      descColor: 'text-amber-700/80',
      ctaColor: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
      path: '/body-scan',
      premium: true,
      badge: '⭐ Premium',
      glow: true
    },
    {
      id: 'future-predictor',
      title: '🔮 Future Health Predictor',
      description: 'Predict next 30 days health risks based on your lifestyle.',
      icon: <TrendingUp className="w-6 h-6" />,
      cta: 'Predict Now',
      price: '₹29',
      gradient: 'from-purple-50 to-indigo-50',
      textColor: 'text-indigo-900',
      descColor: 'text-indigo-700/80',
      ctaColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-600',
      path: '/future-predictor',
      premium: true,
      badge: 'New'
    },
    {
      id: 'mood-ayurveda',
      title: '🧘 Mood-Based Ayurveda',
      description: 'Select your mood for instant Ayurvedic remedies and drinks.',
      icon: <Heart className="w-6 h-6" />,
      cta: 'Find Balance',
      price: 'Free',
      gradient: 'from-rose-50 to-orange-50',
      textColor: 'text-rose-900',
      descColor: 'text-rose-700/80',
      ctaColor: 'text-rose-600',
      iconBg: 'bg-rose-100 text-rose-600',
      path: '/mood-ayurveda',
      badge: 'Popular'
    },
    {
      id: 'chat',
      title: 'Ask Ayurzenix',
      description: 'Chat with our AI Ayurvedic expert for instant guidance.',
      icon: <MessageCircle className="w-6 h-6" />,
      cta: 'Start Chat',
      price: 'Free',
      gradient: 'from-green-50 to-teal-50',
      textColor: 'text-teal-900',
      descColor: 'text-teal-700/80',
      ctaColor: 'text-teal-600',
      iconBg: 'bg-teal-100 text-teal-600',
      path: '/chat'
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Section */}
      <div className="px-6 pt-8 pb-6 space-y-6">
        <div className="flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Welcome to Ayurzenix 🌿
            </h1>
            <p className="text-gray-500 text-sm font-medium">Your daily path to wellness</p>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm"
          >
            <Wallet className="w-4 h-4 text-[#22C55E]" />
            <span className="text-sm font-bold text-gray-700">₹{userData.wallet_balance || 0}</span>
          </motion.button>
        </div>

        {/* Daily Tip Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-6 text-white shadow-xl shadow-green-100"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Leaf className="w-24 h-24 rotate-12" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Daily Wellness Tip
            </div>
            <p className="text-lg font-bold leading-tight">
              "Start your day with warm water and lemon to ignite your Agni (digestive fire)."
            </p>
            <div className="flex items-center gap-2 text-xs text-white/70 font-medium pt-2">
              <TrendingUp className="w-3 h-3" />
              Boosts metabolism & immunity
            </div>
          </div>
        </motion.div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Free Scans</p>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-black text-gray-900">{userData.free_results_count || 0}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22C55E]" />
              <span className="text-lg font-black text-gray-900">{userData.is_premium ? 'Premium' : 'Free'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Intelligent Features</h2>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        
        <div className="space-y-4">
          {/* Daily Ayur Routine Card - Moved to top for better visibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/daily-routine')}
            className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl transition-all hover:shadow-2xl cursor-pointer group ${
              dailyProgress === 100 
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Zap className="w-3 h-3" />
                🔥 {dailyStreak} DAY STREAK
              </div>
            </div>

            <div className="flex items-start gap-5 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                dailyProgress === 100 ? 'bg-green-200 text-[#22C55E]' : 'bg-green-50 text-[#22C55E]'
              }`}>
                {dailyProgress === 100 ? <CheckCircle2 className="w-7 h-7" /> : <Leaf className="w-7 h-7" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Daily Ayur Routine</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                    🔥 Daily
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {dailyProgress === 100 ? 'All tasks completed! Great job.' : 'Complete your personalized daily wellness plan.'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Progress</span>
                <span className="text-sm font-black text-[#22C55E]">{dailyProgress}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  className="h-full bg-gradient-to-r from-[#22C55E] to-[#1B4332]"
                />
              </div>
            </div>

            <div className={`mt-6 w-full font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              dailyProgress === 100
                ? 'bg-white text-[#22C55E] border border-green-200'
                : 'bg-[#22C55E] text-white shadow-green-200'
            }`}>
              {dailyProgress === 100 ? 'View Routine' : 'Continue Today'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Other Feature Cards */}
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(feature.path)}
              className={`relative group cursor-pointer overflow-hidden rounded-[2rem] border p-6 shadow-xl transition-all hover:shadow-2xl bg-gradient-to-br ${feature.gradient} ${
                feature.glow ? 'ring-2 ring-amber-400/30 shadow-amber-100/50' : 'border-gray-100'
              }`}
            >
              {feature.badge && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {feature.badge}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${feature.iconBg}`}>
                  {feature.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-black tracking-tight ${feature.textColor}`}>{feature.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      feature.premium ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-gray-500'
                    }`}>
                      {feature.price}
                    </span>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed ${feature.descColor || 'text-gray-500'}`}>
                    {feature.description}
                  </p>
                  
                  <div className={`pt-4 flex items-center gap-2 font-black text-sm ${feature.ctaColor || 'text-[#22C55E]'}`}>
                    {feature.cta}
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 bg-black"></div>
            </motion.div>
          ))}
        </div>

        {/* Product Recommendation Engine Upgrade */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended for You</h2>
            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {[
              { name: 'Neem & Aloe Vera', category: 'Face Wash', price: '₹299', rating: '4.8', tag: '⭐ Most Recommended' },
              { name: 'Ashwagandha Churna', category: 'Energy', price: '₹450', rating: '4.9', tag: '🧬 For Your Type' },
              { name: 'Brahmi Oil', category: 'Hair Care', price: '₹350', rating: '4.7', tag: '🔥 Trending' }
            ].map((product, i) => (
              <motion.div 
                key={i}
                whileTap={{ scale: 0.95 }}
                className="min-w-[200px] bg-white border border-gray-100 rounded-[2rem] p-5 shadow-lg shadow-gray-100/50 space-y-4"
              >
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
                  <img 
                    src={`https://loremflickr.com/200/200/ayurveda,product,herb?lock=${i}`} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[8px] font-black px-2 py-1 rounded-lg shadow-sm uppercase tracking-widest">
                      {product.tag}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-900 leading-tight">{product.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-sm font-black text-gray-900">{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-gray-900">{product.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center gap-4 px-6">
        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <a href="/privacy" className="hover:text-[#22C55E] transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
          <a href="/terms" className="hover:text-[#22C55E] transition-colors">Terms of Service</a>
        </div>
        <p className="text-[10px] text-gray-300">
          © {new Date().getFullYear()} Blastofinish Technologies
        </p>
      </div>
    </div>
  );
}
