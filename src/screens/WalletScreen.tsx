import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Wallet, 
  Plus, 
  History, 
  ChevronRight, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  increment
} from 'firebase/firestore';

interface WalletScreenProps {
  userData: any;
}

export default function WalletScreen({ userData }: WalletScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(location.state?.message || null);

  const rechargeOptions = [
    { amount: 50, label: '₹50', bonus: 'Basic' },
    { amount: 100, label: '₹100', bonus: 'Popular' },
    { amount: 200, label: '₹200', bonus: 'Best Value' }
  ];

  useEffect(() => {
    if (userData?.uid) {
      fetchTransactions();
    }
  }, [userData?.uid]);

  const fetchTransactions = async () => {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('uid', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleRecharge = (amount: number) => {
    setLoading(true);
    const options = {
      key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "Ayurzenix",
      description: `Wallet Recharge - ₹${amount}`,
      handler: async function (response: any) {
        try {
          // Update wallet balance using increment to avoid stale state
          const userRef = doc(db, 'users', userData.uid);
          await updateDoc(userRef, {
            wallet_balance: increment(amount)
          });

          // Record transaction
          const transRef = doc(collection(db, 'transactions'));
          await setDoc(transRef, {
            uid: userData.uid,
            amount: amount,
            type: 'recharge',
            status: 'success',
            razorpay_payment_id: response.razorpay_payment_id,
            createdAt: serverTimestamp()
          });

          setMessage(`Successfully recharged ₹${amount}!`);
          fetchTransactions();
        } catch (error) {
          console.error("Error updating wallet:", error);
          setMessage("Payment successful but failed to update wallet. Please contact support.");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: userData.displayName,
        email: userData.email,
        contact: userData.phoneNumber
      },
      theme: {
        color: "#22C55E"
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">My Wallet</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage Funds</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-green-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
              <h2 className="text-5xl font-black tracking-tight">₹{userData.wallet_balance || 0}</h2>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              Secure & Instant Payments
            </div>
          </div>
        </motion.div>

        {/* Message Alert */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                message.includes('Success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}
            >
              {message.includes('Success') ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-bold">{message}</p>
              <button onClick={() => setMessage(null)} className="ml-auto text-xs font-black uppercase">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recharge Options */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Plus className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Add Funds</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {rechargeOptions.map((option) => (
              <button
                key={option.amount}
                disabled={loading}
                onClick={() => handleRecharge(option.amount)}
                className="group relative flex items-center justify-between bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-[#22C55E] group-hover:bg-[#22C55E] group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{option.label}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{option.bonus}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center space-y-2">
                <p className="text-gray-400 font-bold text-sm">No transactions yet</p>
                <p className="text-xs text-gray-300">Your recharge history will appear here</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'recharge' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {tx.type === 'recharge' ? <Plus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        {tx.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-black ${
                    tx.type === 'recharge' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {tx.type === 'recharge' ? '+' : '-'}₹{tx.amount}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
          <p className="text-lg font-black text-gray-900">Processing Payment...</p>
          <p className="text-sm text-gray-500 font-medium">Please do not close the app</p>
        </div>
      )}
    </div>
  );
}
