import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Send, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthScanScreenProps {
  userData: any;
}

export default function HealthScanScreen({ userData }: HealthScanScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    weight: '',
    lifestyle: 'Active',
    medicalHistory: '',
    currentSymptoms: '',
    knownDiseases: '',
    duration: '',
  });

  if (!userData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isDeveloper = userData?.email === 'Help@ayurzenix.in';
    if (!isDeveloper && (userData.free_results_count || 0) <= 0 && (userData.wallet_balance || 0) < 10) {
      alert("Insufficient balance. Please recharge your wallet.");
      navigate('/wallet');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        type: 'health_scan',
        age: Number(formData.age),
        weight: formData.weight ? Number(formData.weight) : null,
        uid: userData.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'health_profiles'), profileData);
      
      // Deduct balance or free count (Skip for developer)
      if (!isDeveloper) {
        const userRef = doc(db, 'users', userData.uid);
        if ((userData.free_results_count || 0) > 0) {
          await updateDoc(userRef, {
            free_results_count: (userData.free_results_count || 0) - 1
          });
        } else {
          await updateDoc(userRef, {
            wallet_balance: (userData.wallet_balance || 0) - 10
          });
        }
      }

      navigate(`/result/${docRef.id}`);
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Smart Health Scan</h1>
      </div>

      <div className="px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-gray-500">Describe your symptoms and lifestyle for a personalized Ayurvedic analysis.</p>
          
          {(userData.free_results_count || 0) > 0 ? (
            <div className="mt-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
              You have {userData.free_results_count} free analyses left!
            </div>
          ) : (
            <div className="mt-4 bg-green-50 text-[#22C55E] px-4 py-2 rounded-lg text-sm font-medium">
              Cost per analysis: ₹10
            </div>
          )}
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Age</label>
              <input
                required
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="e.g. 25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Lifestyle</label>
              <select
                name="lifestyle"
                value={formData.lifestyle}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                <option>Active</option>
                <option>Sedentary</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Current Symptoms</label>
            <textarea
              required
              name="currentSymptoms"
              value={formData.currentSymptoms}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
              placeholder="Describe how you feel in natural language..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Medical History & Known Diseases</label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
              placeholder="Any past conditions or ongoing diseases..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Duration of Symptoms</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#22C55E] focus:ring-2 focus:ring-green-100 outline-none transition-all"
              placeholder="e.g. 3 days, 2 weeks"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-[#22C55E] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze with AI
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
