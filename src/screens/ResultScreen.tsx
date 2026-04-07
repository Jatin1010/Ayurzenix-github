import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { analyzeHealthProfile, analyzeBodyScan, generateProductSketch } from '../lib/gemini';
import { Loader2, Share2, ShoppingCart, CheckCircle2, XCircle, Info, MessageSquare, ExternalLink, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ResultScreenProps {
  userData: any;
}

export default function ResultScreen({ userData }: ResultScreenProps) {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generatingSketch, setGeneratingSketch] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      if (!profileId || !userData?.uid) return;
      
      try {
        const profileRef = doc(db, 'health_profiles', profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          navigate('/');
          return;
        }

        const data = profileSnap.data();
        setProfile(data);

        if (data.analysis && data.analysis.doshaAnalysis) {
          setAnalysis(data.analysis);
          setLoading(false);
        } else {
          console.log("Generating new analysis...");
          let result;
          if (data.type === 'body_scan' && data.image) {
            result = await analyzeBodyScan(data.image, userData.language || 'en');
          } else {
            result = await analyzeHealthProfile(data, userData.language || 'en');
          }
          
          console.log("Analysis generated successfully:", result);
          if (!result || !result.doshaAnalysis) {
            throw new Error("Invalid analysis result received");
          }
          await updateDoc(profileRef, { analysis: result });
          setAnalysis(result);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        alert("Failed to generate analysis. Please try again.");
        navigate('/');
      }
    };

    fetchAndAnalyze();
  }, [profileId, userData?.uid, navigate]);

  const handleGenerateSketch = async (productName: string, index: number) => {
    if (generatingSketch) return;
    setGeneratingSketch(productName);
    
    try {
      const sketch = await generateProductSketch(productName);
      if (sketch && profileId) {
        const updatedProducts = [...analysis.suggestedProducts];
        updatedProducts[index] = {
          ...updatedProducts[index],
          sketchImage: sketch
        };
        
        const profileRef = doc(db, 'health_profiles', profileId);
        await updateDoc(profileRef, {
          'analysis.suggestedProducts': updatedProducts
        });
        
        setAnalysis({
          ...analysis,
          suggestedProducts: updatedProducts
        });
      }
    } catch (error) {
      console.error("Error generating sketch:", error);
    } finally {
      setGeneratingSketch(null);
    }
  };

  if (!userData) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ayurzenix Health Analysis',
        text: `My Ayurvedic Dosha: ${analysis?.doshaAnalysis?.dominantDosha}. Check out Ayurzenix for your personalized analysis!`,
        url: window.location.href,
      });
    }
  };

  const handleWhatsAppShare = () => {
    const text = `*Ayurzenix - Ayurvedic Analysis*\n\n*Dominant Dosha:* ${analysis.doshaAnalysis.dominantDosha}\n\n*Insight:* ${analysis.ayurvedicInsight}\n\nCheck your analysis here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing your Doshas...</h3>
        <p className="text-gray-500">Our AI is processing your symptoms using ancient Ayurvedic wisdom.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-gray-900">Your Analysis</h2>
        <div className="flex gap-2">
          <button onClick={handleWhatsAppShare} className="p-2 bg-green-50 rounded-full text-green-600">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button onClick={handleShare} className="p-2 bg-gray-100 rounded-full text-gray-600">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dosha Analysis */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-3xl text-white shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Dominant Dosha</span>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">AI POWERED</div>
        </div>
        <h3 className="text-4xl font-black mb-2">{analysis.doshaAnalysis.dominantDosha}</h3>
        <p className="text-green-50 text-sm leading-relaxed">{analysis.doshaAnalysis.explanation}</p>
        
        {profile?.image && (
          <div className="mt-6 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner">
            <img 
              src={profile.image} 
              alt="Scanned Area" 
              className="w-full h-48 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {Object.entries(analysis.doshaAnalysis.levels).map(([dosha, level]: [string, any]) => (
            <div key={dosha} className="bg-white/10 p-2 rounded-xl">
              <div className="text-[10px] uppercase font-bold opacity-70">{dosha}</div>
              <div className="text-lg font-bold">{level}%</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insight */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-[#22C55E]">
          <Info className="w-5 h-5" />
          <h4 className="font-bold">Ayurvedic Insight</h4>
        </div>
        <div className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown>{analysis.ayurvedicInsight}</ReactMarkdown>
        </div>
      </div>

      {/* Remedies */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-900">Remedies & Treatment</h4>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <h5 className="font-bold text-orange-800 mb-2">Home Remedies (Nuskha)</h5>
            <ul className="space-y-2">
              {analysis.remedies.homeRemedies.map((item: string, i: number) => (
                <li key={i} className="text-sm text-orange-700 flex gap-2">
                  <span className="text-orange-400">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <h5 className="font-bold text-green-800 mb-2">Ayurvedic Herbs</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.remedies.herbs.map((item: string, i: number) => (
                <span key={i} className="bg-white px-3 py-1 rounded-full text-xs font-medium text-green-700 border border-green-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Diet Plan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            <h5 className="font-bold text-sm">Eat This</h5>
          </div>
          <ul className="space-y-1">
            {analysis.dietPlan.recommended.map((item: string, i: number) => (
              <li key={i} className="text-xs text-gray-600 leading-tight">{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-red-500">
            <XCircle className="w-4 h-4" />
            <h5 className="font-bold text-sm">Avoid This</h5>
          </div>
          <ul className="space-y-1">
            {analysis.dietPlan.avoid.map((item: string, i: number) => (
              <li key={i} className="text-xs text-gray-600 leading-tight">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lifestyle Guidance */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-lg font-bold text-gray-900">Lifestyle Guidance</h4>
        <div className="space-y-3">
          <div>
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Daily Routine (Dinacharya)</h5>
            <p className="text-sm text-gray-600">{analysis.lifestyleGuidance.dinacharya}</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sleep</h5>
            <p className="text-sm text-gray-600">{analysis.lifestyleGuidance.sleep}</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Yoga & Exercise</h5>
            <div className="flex flex-wrap gap-2 mt-1">
              {analysis.lifestyleGuidance.yoga.map((item: string, i: number) => (
                <span key={i} className="bg-blue-50 text-[#22C55E] px-3 py-1 rounded-full text-[10px] font-bold">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dos & Don'ts */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
          <h5 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Dos
          </h5>
          <ul className="space-y-2">
            {analysis.dosAndDonts.dos.map((item: string, i: number) => (
              <li key={i} className="text-sm text-green-700 flex gap-2">
                <span className="text-green-400">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
          <h5 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Don'ts
          </h5>
          <ul className="space-y-2">
            {analysis.dosAndDonts.donts.map((item: string, i: number) => (
              <li key={i} className="text-sm text-red-700 flex gap-2">
                <span className="text-red-400">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Products */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xl font-black text-gray-900 tracking-tight">Suggested Products</h4>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">
            Expert Recommendations
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.suggestedProducts.map((product: any, i: number) => {
            // Handle old string format or missing fields
            const p = typeof product === 'string' ? {
              name: product,
              description: 'Ayurvedic wellness product for your condition',
              category: 'Ayurvedic',
              price: '₹299',
              rating: 4.5,
              imageSearchTerm: product
            } : {
              ...product,
              price: product.price || '₹299',
              rating: product.rating || 4.5
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden group hover:border-[#22C55E] transition-all flex flex-col"
              >
                {/* Product Image Container */}
                <div className="relative aspect-square bg-[#F9FAFB] overflow-hidden p-6">
                  <div className="w-full h-full rounded-3xl overflow-hidden shadow-inner bg-white relative">
                    <AnimatePresence mode="wait">
                      {p.sketchImage ? (
                        <motion.img 
                          key="sketch"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={p.sketchImage} 
                          alt={p.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.img 
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={`https://loremflickr.com/400/400/ayurveda,herb,medicine,${encodeURIComponent(p.imageSearchTerm || p.name)}?lock=${i}`} 
                          alt={p.name}
                          className="w-full h-full object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </AnimatePresence>

                    {generatingSketch === p.name && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                        <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin mb-2" />
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Generating AI Sketch...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-8 left-8">
                    <span className="bg-[#22C55E] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-green-100 uppercase tracking-wider">
                      {p.category || 'Ayurvedic'}
                    </span>
                  </div>
                  
                  {!p.sketchImage && !generatingSketch && (
                    <button 
                      onClick={() => handleGenerateSketch(p.name, i)}
                      className="absolute bottom-8 right-8 bg-white text-[#22C55E] p-3 rounded-2xl shadow-xl border border-green-50 hover:bg-green-50 transition-colors group/btn"
                    >
                      <Wand2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                    </button>
                  )}

                  <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-gray-900">{p.rating}</span>
                  </div>
                </div>
                
                <div className="p-6 pt-2 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h5 className="text-lg font-black text-gray-900 leading-tight group-hover:text-[#22C55E] transition-colors">
                      {p.name}
                    </h5>
                    <p className="text-xs text-gray-500 line-clamp-2 font-bold leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</p>
                      <p className="text-xl font-black text-gray-900">{p.price}</p>
                    </div>
                    <a 
                      href={`https://www.amazon.in/s?k=${encodeURIComponent(p.name)}&tag=goldify00-21`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-green-100 hover:shadow-green-200 transition-all active:scale-95"
                    >
                      BUY ON AMAZON
                      <ShoppingCart className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Articles Section */}
      {analysis.articles && analysis.articles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-900">Recommended Articles</h4>
          <div className="space-y-3">
            {analysis.articles.map((article: any, i: number) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h5 className="font-bold text-gray-900 mb-2">{article.title}</h5>
                <div className="text-xs text-gray-500 leading-relaxed mb-3 prose prose-xs max-w-none">
                  <ReactMarkdown>{article.summary}</ReactMarkdown>
                </div>
                <button className="text-[#22C55E] text-xs font-bold flex items-center gap-1">
                  Read Full Article <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Assistant Button */}
      <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center space-y-3">
        <div className="w-12 h-12 bg-[#22C55E] rounded-2xl flex items-center justify-center text-white mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-gray-900">Need more help?</h4>
        <p className="text-sm text-gray-500">Chat with our AI Ayurvedic Assistant for deeper insights.</p>
        <button 
          onClick={() => navigate('/chat')}
          className="w-full bg-[#22C55E] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-100"
        >
          Start Chat
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-400 text-center leading-relaxed">
        <p className="font-bold mb-1 uppercase tracking-widest">Disclaimer</p>
        {analysis.disclaimer || "Ayurzenix provides Ayurvedic wellness guidance based on AI analysis. This is not a medical diagnosis. Consult a qualified Ayurvedic practitioner or doctor for serious health conditions."}
      </div>
    </div>
  );
}
