import { Stethoscope, Calendar, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function ConsultationScreen() {
  const doctors = [
    { name: 'Dr. Aarav Sharma', specialty: 'Ayurvedic Physician', experience: '12 years', rating: 4.9 },
    { name: 'Dr. Ishani Patel', specialty: 'Panchakarma Expert', experience: '8 years', rating: 4.8 },
    { name: 'Dr. Vikram Mehra', specialty: 'Herbal Medicine Specialist', experience: '15 years', rating: 5.0 },
  ];

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#22C55E]">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Expert Consultation</h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-3xl text-white shadow-lg"
      >
        <h3 className="text-xl font-bold mb-2">Book a Video Call</h3>
        <p className="text-green-50 text-sm mb-4">Get personalized guidance from certified Ayurvedic doctors from the comfort of your home.</p>
        <button className="bg-white text-[#22C55E] px-6 py-2 rounded-xl font-bold text-sm shadow-md">
          Book Now
        </button>
      </motion.div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-900">Available Doctors</h4>
        <div className="space-y-4">
          {doctors.map((doc, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-900">{doc.name}</h5>
                <p className="text-xs text-gray-500">{doc.specialty}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] bg-green-50 text-[#22C55E] px-2 py-0.5 rounded-full font-bold">{doc.experience} exp</span>
                  <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-bold">★ {doc.rating}</span>
                </div>
              </div>
              <button className="p-2 text-[#22C55E]">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center space-y-2">
        <Clock className="w-8 h-8 text-gray-400 mx-auto" />
        <h4 className="font-bold text-gray-900 text-sm">Coming Soon: Instant Consult</h4>
        <p className="text-xs text-gray-500">Connect with an available doctor in under 5 minutes for urgent queries.</p>
      </div>
    </div>
  );
}
