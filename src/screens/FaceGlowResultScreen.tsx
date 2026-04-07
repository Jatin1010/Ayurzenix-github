import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { generateProductSketch } from '../lib/gemini';
import { 
  Loader2, 
  Share2, 
  ShoppingCart, 
  CheckCircle2, 
  Sparkles, 
  Wand2, 
  ChevronLeft, 
  Droplets, 
  Info, 
  ArrowRight,
  Download,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';

interface FaceGlowResultScreenProps {
  userData: any;
}

export default function FaceGlowResultScreen({ userData }: FaceGlowResultScreenProps) {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generatingSketch, setGeneratingSketch] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!profileId) return;
      try {
        const profileRef = doc(db, 'health_profiles', profileId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setAnalysis(data.analysis);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error("Error fetching analysis:", err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [profileId, navigate]);

  const handleGenerateSketch = async (productName: string, index: number) => {
    if (generatingSketch) return;
    setGeneratingSketch(productName);
    try {
      const sketch = await generateProductSketch(productName);
      if (sketch && profileId) {
        const updatedProducts = [...analysis.recommendedProducts];
        updatedProducts[index] = { ...updatedProducts[index], sketchImage: sketch };
        const profileRef = doc(db, 'health_profiles', profileId);
        await updateDoc(profileRef, { 'analysis.recommendedProducts': updatedProducts });
        setAnalysis({ ...analysis, recommendedProducts: updatedProducts });
      }
    } catch (err) {
      console.error("Error generating sketch:", err);
    } finally {
      setGeneratingSketch(null);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const image = canvas.toDataURL('image/png');
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], 'my-glow-score.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Ayurzenix Glow Score',
          text: `I just analyzed my skin glow with Ayurzenix AI! My score is ${analysis.glowScore}/100 ✨`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.href = image;
        link.download = 'my-glow-score.png';
        link.click();
      }
    } catch (err) {
      console.error("Share Error:", err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-lg font-black text-gray-900">Finalizing Analysis...</p>
          <p className="text-xs text-gray-500 font-medium">Preparing your personalized glow report</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Glow Analysis</h1>
        <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#22C55E]">
          {sharing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Shareable Card (Hidden from view, used for capture) */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={shareCardRef} className="w-[400px] bg-white p-8 space-y-8 rounded-[3rem] border-8 border-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#22C55E]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Ayurzenix</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Face Glow Analyzer</p>
              </div>
            </div>
          </div>
          
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img src={profile?.image} alt="User" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Glow Score</p>
                <p className="text-6xl font-black">{analysis.glowScore}<span className="text-2xl opacity-60">/100</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Hydration</p>
                <p className="text-xl font-black">{analysis.hydrationLevel}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4">
            <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
              "Your skin reflects your inner health. This AI analysis highlights your natural radiance based on Ayurvedic principles."
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-[#22C55E] uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" />
              Verified by Ayurzenix AI
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Glow Score Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-green-100 group"
        >
          <img src={profile?.image} alt="Face" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-10 left-10 right-10 space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Skin Glow Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-white">{analysis.glowScore}</span>
                  <span className="text-2xl font-bold text-white/50">/100</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Hydration</p>
                <div className="flex items-center gap-2 justify-end text-white">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-black">{analysis.hydrationLevel}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${analysis.glowScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-white shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              />
            </div>
          </div>
        </motion.div>

        {/* Observations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">AI Observations</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {analysis.observations.map((obs: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-2"
              >
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full" />
                  {obs.title}
                </h4>
                <p className="text-xs text-gray-500 font-bold leading-relaxed">{obs.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Possible Causes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Info className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Possible Causes</h3>
          </div>
          <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8 space-y-6">
            {analysis.possibleCauses.map((cause: any, i: number) => (
              <div key={i} className="space-y-2">
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">{cause.title}</h4>
                <p className="text-xs text-amber-700 font-bold leading-relaxed">{cause.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Glow Routine</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(analysis.suggestions).map(([key, items]: [string, any], i: number) => (
              <div key={key} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/50 space-y-4">
                <h4 className="text-xs font-black text-[#22C55E] uppercase tracking-widest">{key} Plan</h4>
                <ul className="space-y-3">
                  {items.map((item: string, j: number) => (
                    <li key={j} className="flex items-start gap-3 text-xs text-gray-600 font-bold leading-relaxed">
                      <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Products */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Glow Boosters</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
              AI Recommendations
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.recommendedProducts.map((product: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden group hover:border-[#22C55E] transition-all flex flex-col"
              >
                <div className="relative aspect-square bg-[#F9FAFB] overflow-hidden p-6">
                  <div className="w-full h-full rounded-3xl overflow-hidden shadow-inner bg-white relative">
                    <AnimatePresence mode="wait">
                      {product.sketchImage ? (
                        <motion.img 
                          key="sketch"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={product.sketchImage} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.img 
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={`https://loremflickr.com/400/400/ayurveda,skincare,herb,${encodeURIComponent(product.imageSearchTerm || product.name)}?lock=${i}`} 
                          alt={product.name}
                          className="w-full h-full object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </AnimatePresence>

                    {generatingSketch === product.name && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                        <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin mb-2" />
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Generating AI Sketch...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-8 left-8">
                    <span className="bg-[#22C55E] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-green-100 uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  
                  {!product.sketchImage && !generatingSketch && (
                    <button 
                      onClick={() => handleGenerateSketch(product.name, i)}
                      className="absolute bottom-8 right-8 bg-white text-[#22C55E] p-3 rounded-2xl shadow-xl border border-green-50 hover:bg-green-50 transition-colors group/btn"
                    >
                      <Wand2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                    </button>
                  )}

                  <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-gray-900">{product.rating || 4.5}</span>
                  </div>
                </div>
                
                <div className="p-6 pt-2 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h5 className="text-lg font-black text-gray-900 leading-tight group-hover:text-[#22C55E] transition-colors">
                      {product.name}
                    </h5>
                    <p className="text-xs text-gray-500 line-clamp-2 font-bold leading-relaxed">
                      {product.benefit}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</p>
                      <p className="text-xl font-black text-gray-900">{product.price || '₹499'}</p>
                    </div>
                    <a 
                      href={`https://www.amazon.in/s?k=${encodeURIComponent(product.name)}&tag=goldify00-21`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-green-100 hover:shadow-green-200 transition-all active:scale-95"
                    >
                      BUY NOW
                      <ShoppingCart className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => navigate('/daily-routine')}
          className="w-full bg-[#22C55E] text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          Improve My Skin Glow
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Safety Disclaimer */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed text-center uppercase tracking-widest">
            Disclaimer: This AI analysis is for wellness guidance only and does not constitute medical advice. Consult a dermatologist for persistent skin conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
