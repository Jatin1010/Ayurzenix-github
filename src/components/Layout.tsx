import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, User, History, MessageSquare, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  userData: any;
}

export default function Layout({ userData }: LayoutProps) {
  const location = useLocation();
  const isHomeScreen = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-xl">
      {!isHomeScreen && (
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#22C55E]">Ayurzenix</h1>
          <div className="flex items-center gap-2">
            <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm font-semibold text-[#22C55E]">₹{userData?.wallet_balance || 0}</span>
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 pb-24 overflow-y-auto", isHomeScreen ? "pt-0" : "")}>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </NavLink>

        <NavLink 
          to="/history" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-xs font-medium">History</span>
        </NavLink>

        <NavLink 
          to="/chat" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-xs font-medium">Chat</span>
        </NavLink>

        <NavLink 
          to="/consultation" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <Stethoscope className="w-6 h-6" />
          <span className="text-xs font-medium">Consult</span>
        </NavLink>
        
        <NavLink 
          to="/wallet" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs font-medium">Wallet</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-[#22C55E]" : "text-gray-400"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
