import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { analyzeBodyScan } from '../lib/gemini';
import { Camera, Upload, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface BodyScanScreenProps {
  userData: any;
}

export default function BodyScanScreen({ userData }: BodyScanScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Resize and compress image aggressively for Firestore storage
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
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

          // Compress to JPEG with 0.5 quality to stay well under 1MB
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          
          // Check size (Firestore limit is 1MB, but we want to be safe)
          const sizeInBytes = Math.ceil((compressedBase64.length * 3) / 4);
          if (sizeInBytes > 800000) { // 800KB limit
            alert("Image is too large. Please try a smaller or simpler photo.");
            return;
          }
          
          setImage(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartScan = async () => {
    if (!image) {
      alert("Please upload or capture an image first.");
      return;
    }

    const isDeveloper = userData?.email === 'Help@ayurzenix.in';
    if (!isDeveloper && (userData.wallet_balance || 0) < 20) {
      alert("Insufficient balance. AI Body Scan costs ₹20. Please recharge your wallet.");
      navigate('/wallet');
      return;
    }

    setLoading(true);
    try {
      // 1. Generate Analysis
      const result = await analyzeBodyScan(image, userData.language || 'en');

      // 2. Save to Firestore
      const profileData = {
        type: 'body_scan',
        image: image, // Note: Storing base64 in Firestore is okay for small images, but ideally should be Storage
        uid: userData.uid,
        createdAt: serverTimestamp(),
        analysis: result
      };

      const docRef = await addDoc(collection(db, 'health_profiles'), profileData);

      // 3. Deduct balance (Skip for developer)
      if (!isDeveloper) {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, {
          wallet_balance: (userData.wallet_balance || 0) - 20
        });
      }

      // 4. Navigate to results
      navigate(`/result/${docRef.id}`);
    } catch (error) {
      console.error("Error in body scan:", error);
      alert("Something went wrong during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">AI Body Scan</h1>
      </div>

      <div className="px-6 py-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Premium AI Analysis
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Visual Intelligence</h2>
          <p className="text-gray-500">Upload a clear photo of the affected area (skin, tongue, etc.) for a deep Ayurvedic visual analysis.</p>
        </motion.div>

        <div className="aspect-square w-full max-w-sm mx-auto bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
          {image ? (
            <img src={image} alt="Upload" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center space-y-4 p-8">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-400 group-hover:text-[#22C55E] transition-colors">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Tap to capture or upload photo</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Cost per scan</span>
              <span className="text-[#22C55E] font-bold">₹20</span>
            </div>
          </div>

          <button
            onClick={handleStartScan}
            disabled={loading}
            className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Start AI Analysis
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-gray-900">How it works</h3>
          <ul className="space-y-3">
            {[
              "Ensure good lighting for the photo",
              "AI analyzes visual markers and patterns",
              "Receive personalized insights & remedies",
              "Get recommended Ayurvedic products"
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-[#22C55E] shadow-sm shrink-0 mt-0.5">
                  {i + 1}
                </div>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
