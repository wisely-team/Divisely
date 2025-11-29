import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, PieChart, Users, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UIComponents';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:h-screen sticky top-0 z-10 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-lg shadow-sm">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Divisely</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium"
          >
            <PieChart className="w-5 h-5" />
            Dashboard
          </Link>
          <div className="px-4 py-2 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Groups
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium"
          >
            <Users className="w-5 h-5" />
            My Groups
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img
              src={currentUser?.avatar}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
