import { useState, useEffect, useRef } from 'react';
import { auth, googleProvider, RecaptchaVerifier } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { Loader2, Mail, Lock, Chrome, Phone, Smartphone, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OtpInput from '../components/OtpInput';
import { cn } from '../lib/utils';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpString, setOtpString] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (authMethod === 'phone' && !recaptchaRef.current) {
      const initRecaptcha = () => {
        const container = document.getElementById('recaptcha-container');
        if (container && !container.hasChildNodes()) {
          try {
            recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => {
                console.log('reCAPTCHA solved');
              }
            });
          } catch (error) {
            console.error("reCAPTCHA initialization error:", error);
          }
        }
      };
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(initRecaptcha, 100);
      return () => clearTimeout(timeout);
    }
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
  }, [authMethod]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Failed to login with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      const container = document.getElementById('recaptcha-container');
      if (!recaptchaRef.current && container) {
        // Only initialize if container is empty to avoid "already rendered" error
        if (!container.hasChildNodes()) {
          recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
          });
        }
      }
      const appVerifier = recaptchaRef.current;
      const formattedPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
      
      console.log('Sending OTP to:', formattedPhone);
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setTimer(60);
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
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
    if (!confirmationResult) return;
    if (otpString.length !== 6) {
      alert("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await confirmationResult.confirm(otpString);
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 max-w-md mx-auto">
      <div id="recaptcha-container"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent"></div>
          <Leaf className="w-12 h-12 text-[#22C55E] fill-[#22C55E]/20 group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Ayurzenix</h1>
        <p className="text-gray-500 text-sm font-medium mb-4">Your AI-Powered Ayurvedic Advisor</p>
        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 max-w-xs mx-auto">
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Ayurzenix helps you discover your body constitution (Prakriti) and provides personalized Ayurvedic wellness recommendations for a balanced lifestyle.
          </p>
        </div>
      </motion.div>

      <div className="w-full space-y-6">
        {/* Auth Method Toggle */}
        <div className="flex bg-gray-50 p-1 rounded-2xl">
          <button 
            onClick={() => { setAuthMethod('email'); setConfirmationResult(null); }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              authMethod === 'email' ? "bg-white text-[#22C55E] shadow-sm" : "text-gray-400"
            )}
          >
            Email
          </button>
          <button 
            onClick={() => { setAuthMethod('phone'); setConfirmationResult(null); }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              authMethod === 'phone' ? "bg-white text-[#22C55E] shadow-sm" : "text-gray-400"
            )}
          >
            Phone
          </button>
        </div>

        <AnimatePresence mode="wait">
          {authMethod === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleEmailAuth} 
              className="space-y-4"
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all"
                  placeholder="Email Address"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all"
                  placeholder="Password"
                />
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Login' : 'Create Account')}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="phone-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all"
                      placeholder="Phone Number (with +91)"
                    />
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-gray-900">Verify Phone</h3>
                    <p className="text-xs text-gray-500">Enter the 6-digit code sent to {phoneNumber}</p>
                  </div>

                  <div className="flex justify-center">
                    <OtpInput 
                      length={6} 
                      onComplete={(otp) => {
                        setOtpString(otp);
                        // Optional: auto-submit if you want
                      }} 
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      disabled={loading || otpString.length !== 6}
                      type="submit"
                      className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                    </button>

                    <div className="flex flex-col items-center gap-3">
                      {timer > 0 ? (
                        <p className="text-xs text-gray-400 font-medium">Resend OTP in {timer}s</p>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleSendOtp()}
                          className="text-[#22C55E] text-xs font-bold"
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
                        className="text-gray-400 text-xs font-bold"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <Chrome className="w-5 h-5 text-[#4285F4]" />
          Google
        </button>

        {authMethod === 'email' && (
          <p className="text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#22C55E] font-bold"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        )}

        <div className="pt-8 flex flex-col items-center gap-4">
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
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
