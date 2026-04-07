import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles, Wallet, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeFaceGlow } from '../lib/gemini';

interface FaceGlowScreenProps {
  userData: any;
}

export default function FaceGlowScreen({ userData }: FaceGlowScreenProps) {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const COST = 20;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.6 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          // Size check
          const sizeInBytes = Math.ceil((compressedBase64.length * 3) / 4);
          if (sizeInBytes > 800000) {
            alert("Image is too large. Please try a smaller photo.");
            return;
          }

          setImage(compressedBase64);
          setError(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    
    const isDeveloper = userData?.email === 'Help@ayurzenix.in';
    
    if (!isDeveloper && (userData?.wallet_balance || 0) < COST) {
      setError(`Insufficient balance. Please recharge your wallet with at least ₹${COST}.`);
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // 1. Analyze with Gemini first
      const result = await analyzeFaceGlow(image, userData.language || 'en');

      // 2. Deduct from wallet (Skip for developer)
      const userRef = doc(db, 'users', userData.uid);
      if (!isDeveloper) {
        await updateDoc(userRef, {
          wallet_balance: increment(-COST)
        });
      }

      // 3. Save to health_profiles
      const profileRef = await addDoc(collection(db, 'health_profiles'), {
        uid: userData.uid,
        type: 'face_glow',
        image: image,
        analysis: result,
        createdAt: serverTimestamp()
      });

      // 4. Navigate to result
      navigate(`/face-glow/result/${profileRef.id}`);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError("Failed to analyze image. Please try again.");
      // No refund needed since we haven't deducted yet
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Face Glow Analyzer</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-8">
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

        {/* Image Upload/Capture */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
                >
                  <AlertCircle className="w-5 h-5 rotate-45" />
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-gray-100 flex items-center justify-center mx-auto text-[#22C55E]">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-gray-900">Ready for your glow scan?</p>
                  <p className="text-xs text-gray-500 font-medium">Take a clear photo of your face in good lighting.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-3 bg-white border border-gray-100 p-6 rounded-[2rem] shadow-lg shadow-gray-100/50 hover:border-[#22C55E] transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 text-[#22C55E] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Take Photo</span>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 bg-white border border-gray-100 p-6 rounded-[2rem] shadow-lg shadow-gray-100/50 hover:border-[#22C55E] transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Gallery</span>
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            capture="user" 
            className="hidden" 
          />
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
                {error.includes('Insufficient balance') && (
                  <button 
                    onClick={() => navigate('/wallet')}
                    className="text-xs font-black text-rose-900 underline underline-offset-4 pt-1"
                  >
                    Go to Wallet
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        <button
          disabled={!image || analyzing}
          onClick={startAnalysis}
          className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
            !image || analyzing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#22C55E] text-white shadow-green-200 active:scale-95'
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Skin...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze Glow (₹{COST})
            </>
          )}
        </button>

        {/* Info Section */}
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">What you'll get:</h4>
          <ul className="space-y-3">
            {[
              "AI Skin Glow Score (0-100)",
              "Hydration & Texture Analysis",
              "Ayurvedic Skincare Routine",
              "Personalized Product Suggestions",
              "Shareable Glow Card"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
