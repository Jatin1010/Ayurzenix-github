import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { History, ChevronRight, Calendar, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryScreenProps {
  userData: any;
}

export default function HistoryScreen({ userData }: HistoryScreenProps) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, 'health_profiles'),
      where('uid', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
          <History className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Activity className="w-8 h-8 text-[#22C55E] animate-pulse" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No analyses found yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-[#22C55E] font-bold text-sm"
          >
            Start your first analysis →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile, index) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
               transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/result/${profile.id}`)}
              className="w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-[#22C55E] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex flex-col items-center justify-center text-[#22C55E]">
                  <span className="text-[10px] font-black uppercase leading-none">
                    {profile.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {profile.createdAt?.toDate().getDate()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 line-clamp-1">
                    {profile.analysis?.doshaAnalysis?.dominantDosha || 'Pending Analysis'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{profile.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
