import { motion } from 'motion/react';
import { ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Privacy Policy</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Last Updated: April 3, 2026</p>
        </div>
      </div>

      <div className="prose prose-sm text-gray-600 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, use our AI health analysis features, or communicate with us. This may include your name, email address, phone number, and health-related information you choose to share for analysis.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including our AI-powered Ayurvedic analysis. Your health data is used solely for the purpose of generating wellness insights and is not shared with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Data Security</h2>
          <p>We implement reasonable security measures to protect the information we collect. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Your Choices</h2>
          <p>You can access and update certain information about yourself by logging into your account. You may also contact us to request the deletion of your personal information.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at Help@Ayurzenix.in.</p>
        </section>
        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold text-gray-300">
            A product of Blastofinish Technologies
          </p>
        </div>
      </div>
    </div>
  );
}
