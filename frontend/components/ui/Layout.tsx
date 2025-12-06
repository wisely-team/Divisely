import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, PieChart, Users, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UIComponents';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1075
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1075);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (isDesktop && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isDesktop, isSidebarOpen]);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-6 flex items-center justify-between gap-3 border-b border-gray-100 md:border-b-0">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-lg shadow-sm">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Divisely</span>
        </div>
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <Link
          to="/dashboard"
          onClick={closeSidebar}
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
          onClick={closeSidebar}
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
          onClick={() => {
            closeSidebar();
            handleLogout();
          }}
        >
          <LogOut className="w-4 h-4" /> Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 flex ${isDesktop ? 'flex-row' : 'flex-col'}`}>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-10">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isDesktop && isSidebarOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/30" onClick={closeSidebar} />
          <aside className="relative bg-white h-full w-72 max-w-full shadow-2xl animate-in slide-in-from-left">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!isDesktop && (
          <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="bg-teal-500 p-2 rounded-lg shadow-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Divisely</span>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>
        )}

        <main className={`flex-1 ${isDesktop ? 'p-8' : 'p-4'} overflow-y-auto`}>
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
