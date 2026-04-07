import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import Layout from './components/Layout';
import HomeScreen from './screens/HomeScreen';
import HealthScanScreen from './screens/HealthScanScreen';
import BodyScanScreen from './screens/BodyScanScreen';
import ResultScreen from './screens/ResultScreen';
import ProfileScreen from './screens/ProfileScreen';
import WalletScreen from './screens/WalletScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatScreen from './screens/ChatScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import DailyRoutineScreen from './screens/DailyRoutineScreen';
import FaceGlowScreen from './screens/FaceGlowScreen';
import FaceGlowResultScreen from './screens/FaceGlowResultScreen';
import FuturePredictorScreen from './screens/FuturePredictorScreen';
import MoodAyurvedaScreen from './screens/MoodAyurvedaScreen';
import AuthScreen from './screens/AuthScreen';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import HelpSupport from './screens/HelpSupport';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    let unsubscribeUser: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Setup real-time listener for user data
        unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (!userSnap.exists()) {
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              phoneNumber: firebaseUser.phoneNumber || '',
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              language: 'en',
              free_results_count: 2,
              is_premium: false,
              is_admin: firebaseUser.email === 'Help@ayurzenix.in',
              wallet_balance: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newUser);
            setUserData(newUser);
          } else {
            setUserData(userSnap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("User data listener error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  if (loading || (user && !userData)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route element={user && userData ? <Layout userData={userData} /> : <Navigate to="/auth" />}>
          <Route path="/" element={<HomeScreen userData={userData} />} />
          <Route path="/health-scan" element={<HealthScanScreen userData={userData} />} />
          <Route path="/body-scan" element={<BodyScanScreen userData={userData} />} />
          <Route path="/history" element={<HistoryScreen userData={userData} />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/consultation" element={<ConsultationScreen />} />
          <Route path="/daily-routine" element={<DailyRoutineScreen userData={userData} />} />
          <Route path="/face-glow" element={<FaceGlowScreen userData={userData} />} />
          <Route path="/face-glow/result/:profileId" element={<FaceGlowResultScreen userData={userData} />} />
          <Route path="/future-predictor" element={<FuturePredictorScreen userData={userData} />} />
          <Route path="/mood-ayurveda" element={<MoodAyurvedaScreen userData={userData} />} />
          <Route path="/result/:profileId" element={<ResultScreen userData={userData} />} />
          <Route path="/profile" element={<ProfileScreen userData={userData} />} />
          <Route path="/wallet" element={<WalletScreen userData={userData} />} />
          <Route path="/help" element={<HelpSupport />} />
        </Route>
      </Routes>
    </Router>
  );
}
