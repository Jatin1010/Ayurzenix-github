import { motion } from 'motion/react';
import { ChevronLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-gray-500 font-bold"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#22C55E]">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Terms of Service</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Last Updated: April 3, 2026</p>
        </div>
      </div>

      <div className="prose prose-sm text-gray-600 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Ayurzenix, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Description of Service</h2>
          <p>Ayurzenix provides AI-powered Ayurvedic wellness analysis and insights. Our services are for informational purposes only and are not intended to be a substitute for professional medical advice, diagnosis, or treatment.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when using our services.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Disclaimer of Warranties</h2>
          <p>Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted or error-free.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Limitation of Liability</h2>
          <p>In no event shall Ayurzenix be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Governing Law</h2>
          <p>These Terms of Service shall be governed by and construed in accordance with the laws of India. Ayurzenix is a product of Blastofinish Technologies.</p>
        </section>
        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold text-gray-300">
            © {new Date().getFullYear()} Blastofinish Technologies
          </p>
        </div>
      </div>
    </div>
  );
}
