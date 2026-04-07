import { auth, db, RecaptchaVerifier } from '../lib/firebase';
import { signOut, linkWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { LogOut, Globe, Shield, HelpCircle, ChevronRight, User as UserIcon, Phone, Smartphone, Loader2, CheckCircle2, FileText, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../components/OtpInput';

interface ProfileScreenProps {
  userData: any;
}

export default function ProfileScreen({ userData }: ProfileScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showVerifyPhone, setShowVerifyPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpString, setOtpString] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(0);
  const recaptchaRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        } catch (e) {
          console.error("reCAPTCHA cleanup error:", e);
        }
      }
    };
  }, []);

  if (!userData) return null;

  const handleLogout = () => signOut(auth);

  const toggleLanguage = async () => {
    const newLang = userData.language === 'en' ? 'hi' : 'en';
    const userRef = doc(db, 'users', userData.uid);
    await updateDoc(userRef, { language: newLang });
  };

  const toggleNotifications = async (type: 'app' | 'whatsapp') => {
    const field = type === 'app' ? 'notifications_enabled' : 'whatsapp_enabled';
    const userRef = doc(db, 'users', userData.uid);
    await updateDoc(userRef, { [field]: !userData[field] });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    // Clean the phone number: remove all non-digits except '+'
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    if (!cleaned) {
      alert("Please enter a valid phone number");
      return;
    }

    // Basic length validation
    if (cleaned.startsWith('+')) {
      if (cleaned.length < 10) { // Minimum length for international numbers (e.g. +919876543210)
        alert("Phone number is too short. Please include country code.");
        return;
      }
    } else {
      if (cleaned.length < 10) {
        alert("Phone number must be at least 10 digits");
        return;
      }
    }
    
    setLoading(true);
    try {
      const container = document.getElementById('recaptcha-container-profile');
      if (!recaptchaRef.current && container) {
        if (!container.hasChildNodes()) {
          recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-profile', {
            'size': 'invisible',
          });
        }
      }
      
      const appVerifier = recaptchaRef.current;
      const formattedPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
      
      console.log('Linking phone number:', formattedPhone);
      // Use linkWithPhoneNumber to associate phone with current user
      const result = await linkWithPhoneNumber(auth.currentUser, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setTimer(60);
    } catch (error: any) {
      console.error("Phone Link Error:", error);
      if (error.code === 'auth/invalid-phone-number') {
        alert("Invalid phone number. Please include country code (e.g. +91)");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Too many requests. Please try again later.");
      } else if (error.code === 'auth/billing-not-enabled') {
        alert("Phone authentication requires billing to be enabled in Firebase Console. Please use Google Login or add test phone numbers in Firebase Console.");
      } else {
        alert(error.message || "Failed to send OTP. Please try again.");
      }
      // Reset recaptcha on error
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmationResult || !auth.currentUser) return;
    
    if (otpString.length !== 6) {
      alert("Please enter a 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      await confirmationResult.confirm(otpString);
      
      // Update Firestore with verified phone number
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        phoneNumber: auth.currentUser.phoneNumber
      });
      
      alert("Phone number verified and linked successfully! ✅");
      setShowVerifyPhone(false);
      setConfirmationResult(null);
      setOtpString('');
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-8">
      <div id="recaptcha-container-profile"></div>
      
      <div className="flex items-center gap-4 mb-10">
        {userData.photoURL ? (
          <img src={userData.photoURL} alt="Profile" className="w-20 h-20 rounded-3xl border-4 border-white shadow-lg" />
        ) : (
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-[#22C55E] border-4 border-white shadow-lg">
            <UserIcon className="w-10 h-10" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{userData.displayName}</h2>
          <div className="flex flex-col gap-0.5">
            <p className="text-gray-500 text-sm">{userData.email}</p>
            {userData.phoneNumber ? (
              <div className="flex items-center gap-1.5 text-[#22C55E] text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {userData.phoneNumber}
              </div>
            ) : (
              <button 
                onClick={() => setShowVerifyPhone(true)}
                className="text-[#22C55E] text-xs font-bold flex items-center gap-1 hover:underline"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Verify Phone Number
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVerifyPhone && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100 space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-sm">Verify your phone</h4>
                    <p className="text-xs text-gray-500">We'll send a 6-digit code to verify your identity.</p>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all text-sm"
                      placeholder="Phone Number (e.g. +91...)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      type="submit"
                      className="flex-1 bg-[#22C55E] text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md shadow-green-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVerifyPhone(false)}
                      className="px-4 py-3 text-gray-400 font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h4 className="font-bold text-gray-900 text-sm">Enter OTP</h4>
                    <p className="text-xs text-gray-500">Sent to {phoneNumber}</p>
                  </div>
                  <div className="flex justify-center">
                    <OtpInput 
                      length={6} 
                      onComplete={(otp) => {
                        setOtpString(otp);
                      }} 
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-3">
                    <button
                      disabled={loading || otpString.length !== 6}
                      type="submit"
                      className="w-full bg-[#22C55E] text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md shadow-green-100 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Link'}
                    </button>
                    <div className="flex justify-between items-center px-1">
                      {timer > 0 ? (
                        <p className="text-[10px] text-gray-400 font-medium">Resend in {timer}s</p>
                      ) : (
                        <button 
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[#22C55E] text-[10px] font-bold"
                        >
                          Resend OTP
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => { 
                          setConfirmationResult(null); 
                          setOtpString(''); 
                          if (recaptchaRef.current) {
                            recaptchaRef.current.clear();
                            recaptchaRef.current = null;
                          }
                        }}
                        className="text-gray-400 text-[10px] font-bold"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Smart Notifications</h3>
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">App Notifications</p>
                <p className="text-xs text-gray-500">Daily wellness tips & alerts</p>
              </div>
            </div>
            <button 
              onClick={() => toggleNotifications('app')}
              className={`w-12 h-6 rounded-full transition-colors relative ${userData.notifications_enabled ? 'bg-[#22C55E]' : 'bg-gray-200'}`}
            >
              <motion.div 
                animate={{ x: userData.notifications_enabled ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">WhatsApp Updates</p>
                <p className="text-xs text-gray-500">Personalized health insights</p>
              </div>
            </div>
            <button 
              onClick={() => toggleNotifications('whatsapp')}
              disabled={!userData.phoneNumber}
              className={`w-12 h-6 rounded-full transition-colors relative ${userData.whatsapp_enabled ? 'bg-[#22C55E]' : 'bg-gray-200'} ${!userData.phoneNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.div 
                animate={{ x: userData.whatsapp_enabled ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>
        {!userData.phoneNumber && (
          <p className="text-[10px] text-amber-600 font-bold px-2">
            ⚠️ Please verify your phone number to enable WhatsApp updates.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Settings</h3>
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Language</p>
                <p className="text-xs text-gray-500">{userData.language === 'en' ? 'English' : 'Hindi'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
                <Shield className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-800">Privacy Policy</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/terms')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
                <FileText className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-800">Terms of Service</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-800">Help & Support</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-5 text-red-500 font-bold bg-red-50 rounded-3xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      <div className="text-center pt-8">
        <p className="text-xs text-gray-400">Ayurzenix v1.0.0</p>
        <p className="text-[10px] text-gray-300 mt-1">Made with ❤️ for Ayurvedic Wellness</p>
      </div>
    </div>
  );
}
