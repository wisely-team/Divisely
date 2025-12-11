import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, PieChart, LogOut, Menu, X, Plus, Clock, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UIComponents';
import { QuickGroupList } from './QuickGroupList';
import { CreateGroupModal } from '../groups/CreateGroupModal';
import type { GroupSummary } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, groups, addGroup } = useApp();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1075
  );

  // Convert groups to GroupSummary format
  const groupSummaries: GroupSummary[] = React.useMemo(() => {
    return (groups || []).map(group => ({
      id: group.id,
      name: group.name,
      unreadCount: 0, // TODO: Get from API
      lastActivity: group.created_at
    }));
  }, [groups]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleCreateGroup = (name: string, description: string) => {
    addGroup({
      id: Date.now().toString(),
      name,
      description,
      ownerId: currentUser?.id || '',
      members: [currentUser?.id || ''],
      currency: 'USD',
      created_at: new Date().toISOString(),
    });
    setIsCreateGroupModalOpen(false);
  };

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
      {/* Logo Header */}
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

      {/* Quick Action: New Expense Button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => {
            closeSidebar();
            // TODO: Open AddExpenseModal
            console.log('Open Add Expense Modal');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Expense
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Main Menu */}
        <div className="space-y-1 mb-4">
          <Link
            to="/dashboard"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium"
          >
            <PieChart className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/activity"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium"
          >
            <Clock className="w-5 h-5" />
            Recent Activity
          </Link>
        </div>

        {/* Groups Section */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Groups
          </span>
          <button
            onClick={() => {
              setIsCreateGroupModalOpen(true);
            }}
            className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
            aria-label="Create new group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Group List */}
        <QuickGroupList
          groups={groupSummaries}
          onCloseSidebar={closeSidebar}
        />
      </nav>

      {/* User Profile & Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center gap-3 px-2">
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

        {/* Settings Link */}
        <Link
          to="/settings"
          onClick={closeSidebar}
          className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {/* Logout Button */}
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};
