import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Mail, MessageSquare, Phone, HelpCircle, ExternalLink, Search, ShieldCheck, CreditCard, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const faqs = [
  {
    category: "General",
    icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
    questions: [
      {
        q: "What is Ayurzenix?",
        a: "Ayurzenix is an AI-powered Ayurvedic health advisor that helps you understand your body constitution (Prakriti), current imbalances (Vikriti), and provides personalized wellness recommendations based on ancient Ayurvedic principles."
      },
      {
        q: "Is Ayurzenix a substitute for a doctor?",
        a: "No. Ayurzenix provides wellness guidance based on Ayurvedic concepts. It is not intended to diagnose, treat, or cure any medical condition. Always consult a qualified healthcare professional for medical advice."
      }
    ]
  },
  {
    category: "Account & Privacy",
    icon: <User className="w-5 h-5 text-purple-500" />,
    questions: [
      {
        q: "How is my data protected?",
        a: "We use industry-standard encryption and secure Firebase infrastructure to protect your personal information. Your health data is private and only used to provide personalized recommendations."
      },
      {
        q: "Can I delete my account?",
        a: "Yes, you can request account deletion through the Profile settings or by contacting our support team at Help@Ayurzenix.in."
      }
    ]
  },
  {
    category: "Payments & Wallet",
    icon: <CreditCard className="w-5 h-5 text-green-500" />,
    questions: [
      {
        q: "How do I recharge my wallet?",
        a: "Go to the Wallet screen, enter the amount you wish to add, and complete the payment using our secure Instamojo gateway. We support UPI, Cards, and Netbanking."
      },
      {
        q: "What if my payment fails?",
        a: "If your payment is deducted but not reflected in your wallet, please wait for 30 minutes. If it still doesn't appear, contact us with your transaction ID."
      }
    ]
  }
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-black text-gray-900">Help & Support</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 outline-none transition-all"
          />
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Contact Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.a 
            href="mailto:Help@Ayurzenix.in"
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-gray-900">Email Us</span>
            <span className="text-[10px] text-gray-400">Help@Ayurzenix.in</span>
          </motion.a>

          <motion.a 
            href="https://wa.me/917988055162"
            target="_blank"
            whileHover={{ y: -2 }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-bold text-gray-900">WhatsApp</span>
            <span className="text-[10px] text-gray-400">+91 79880 55162</span>
          </motion.a>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider px-1">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {filteredFaqs.map((category, catIdx) => (
              <div key={catIdx} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  {category.icon}
                  <h3 className="font-bold text-gray-900">{category.category}</h3>
                </div>
                
                <div className="space-y-2">
                  {category.questions.map((item, qIdx) => {
                    const id = `${catIdx}-${qIdx}`;
                    const isExpanded = expandedIndex === id;
                    
                    return (
                      <div 
                        key={qIdx}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                      >
                        <button 
                          onClick={() => setExpandedIndex(isExpanded ? null : id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left"
                        >
                          <span className="text-sm font-bold text-gray-700">{item.q}</span>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-4"
                            >
                              <p className="text-sm text-gray-500 leading-relaxed">
                                {item.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Secure & Private Support</span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
              Ayurzenix Support is available Monday to Saturday, 10 AM - 6 PM IST.
            </p>
            <p className="text-[10px] font-bold text-gray-300">
              A product of Blastofinish Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
