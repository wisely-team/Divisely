import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Users, LogOut, Plus, Wallet, PieChart, Activity, 
  ArrowRight, DollarSign, Trash2, Calendar, 
  Sparkles, MessageSquare, Eye, Github, Mail, Move, ZoomIn,
  Copy, Check, AlertTriangle, User as UserIcon
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';

import { AppProvider, useApp } from './context/AppContext';
import { Button, Card, Input, Modal, Select } from './components/UIComponents';
import { analyzeGroupFinances } from './services/geminiService';
import { Expense, Split, User } from './types';

// --- VISUALIZATION COMPONENTS ---

const InteractiveDebtGraph: React.FC<{ users: User[], balances: { from: string, to: string, amount: number }[] }> = ({ users, balances }) => {
  if (users.length === 0) return null;

  const width = 500;
  const height = 350;
  const cx = width / 2;
  const cy = height / 2;
  const r = 120; // Initial radius

  // State to track positions of nodes
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize positions in a circle on mount
  useEffect(() => {
    const newPos: Record<string, { x: number; y: number }> = {};
    users.forEach((user, i) => {
      const angle = (2 * Math.PI * i) / users.length - Math.PI / 2;
      newPos[user.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    });
    setPositions(newPos);
  }, [users]);

  // Handle Zoom via Ctrl + Scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    setDraggingId(userId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;
    
    // Get SVG coordinate conversion
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    setPositions(prev => ({
      ...prev,
      [draggingId]: { x, y }
    }));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Calculate ViewBox based on zoom
  const vbW = width / zoom;
  const vbH = height / zoom;
  const vbX = (width - vbW) / 2;
  const vbY = (height - vbH) / 2;

  return (
    <div 
      ref={containerRef}
      className="w-full flex justify-center mb-4 overflow-hidden bg-gray-50/50 rounded-xl border border-gray-100 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-2 right-2 text-xs text-gray-400 flex flex-col items-end gap-1 pointer-events-none select-none z-10">
        <div className="flex items-center gap-1"><Move className="w-3 h-3" /> Drag to arrange</div>
        <div className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Ctrl + Scroll to zoom</div>
      </div>
      <svg 
        ref={svgRef}
        width="100%" 
        height={height} 
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="max-w-[500px] select-none cursor-default"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
          
          {users.map(u => (
            <pattern id={`avatar-${u.id}`} key={u.id} height="100%" width="100%" patternContentUnits="objectBoundingBox">
               <rect width="1" height="1" fill="#e5e7eb"/>
               <image href={u.avatar} x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
            </pattern>
          ))}
        </defs>

        {/* Edges (Debts) */}
        {balances.map((b, i) => {
            const start = positions[b.from];
            const end = positions[b.to];
            if(!start || !end) return null;

            // Calculate shortened line
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Padding for node radius (25) + arrow space
            const offsetStart = 30; 
            const offsetEnd = 30;

            if (dist < offsetStart + offsetEnd) return null;

            const x1 = start.x + (dx * offsetStart) / dist;
            const y1 = start.y + (dy * offsetStart) / dist;
            const x2 = end.x - (dx * offsetEnd) / dist;
            const y2 = end.y - (dy * offsetEnd) / dist;

            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
                <g key={i}>
                    {/* Connection Line */}
                    <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#9ca3af" strokeWidth="2" markerEnd="url(#arrow)" />
                    
                    {/* Amount Label */}
                    <rect x={midX - 24} y={midY - 12} width="48" height="24" rx="12" fill="white" stroke="#e5e7eb" className="shadow-sm" />
                    <text x={midX} y={midY} dy="4" textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="bold">
                        ${Math.round(b.amount)}
                    </text>
                </g>
            )
        })}

        {/* Nodes (Users) */}
        {users.map(u => {
            const pos = positions[u.id];
            if (!pos) return null;
            const isDragging = draggingId === u.id;

            return (
                <g 
                  key={u.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => handleMouseDown(e, u.id)}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  className="transition-transform duration-75"
                >
                    {/* Halo effect when dragging */}
                    {isDragging && <circle r="30" fill="rgba(45, 212, 191, 0.2)" />}
                    
                    {/* Border Circle */}
                    <circle r="24" fill="white" stroke={isDragging ? '#2dd4bf' : '#e5e7eb'} strokeWidth={isDragging ? 3 : 2} />
                    
                    {/* Avatar Circle */}
                    <circle r="20" fill={`url(#avatar-${u.id})`} />
                    
                    {/* Name Label */}
                    <text y="40" textAnchor="middle" className="text-xs font-bold fill-gray-700 pointer-events-none select-none" style={{ textShadow: "0px 2px 4px rgba(255,255,255,1)" }}>
                        {u.name.split(' ')[0]}
                    </text>
                </g>
            );
        })}
      </svg>
    </div>
  );
};

// --- AUTH PAGES ---

const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('kevin@divisely.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[#3f6e69] relative overflow-hidden items-center justify-center">
         {/* Abstract Overlay/Pattern */}
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-teal-800/50"></div>
         
         {/* Main Image */}
         <img 
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop" 
            alt="Workspace" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
         />
         
         <div className="relative z-10 text-white p-12 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight">Divisely</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Split expenses, share moments.</h2>
            <p className="text-teal-100 text-lg leading-relaxed">
              Track balances, settle debts, and manage shared costs effortlessly with your friends and family.
            </p>
         </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start lg:hidden mb-6">
               <div className="flex items-center gap-2 text-teal-600">
                  <Wallet className="w-8 h-8" />
                  <span className="text-2xl font-bold">Divisely</span>
               </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="mt-2 text-gray-500">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input 
                label="Email Address" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com"
                className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
              />
              
              <div className="space-y-1">
                 <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-500">Forgot Password?</a>
                 </div>
                 <div className="relative">
                   <input 
                      type="password"
                      className="w-full px-3 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors placeholder-gray-500"
                      placeholder="Enter your password"
                      defaultValue="password123" 
                   />
                   <Eye className="w-5 h-5 text-gray-500 absolute right-3 top-3 cursor-pointer" />
                 </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all">
              Sign In
            </Button>
          </form>
          
          <div className="text-center text-sm">
             <span className="text-gray-500">Don't have an account? </span>
             <a href="#" className="font-semibold text-teal-600 hover:text-teal-500">Sign up</a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
               Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
               <Github className="w-5 h-5" />
               GitHub
            </button>
          </div>
          
          {/* Helper for demo */}
          <div className="text-center text-xs text-gray-400 mt-8">
            <p>Try logging in with:</p>
            <p>kevin@divisely.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium">
            <PieChart className="w-5 h-5" />
            Dashboard
          </Link>
          <div className="px-4 py-2 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Groups
          </div>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors font-medium">
            <Users className="w-5 h-5" />
            My Groups
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={currentUser?.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2 text-sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- DASHBOARD ---

const DashboardPage = () => {
  const { groups, expenses, currentUser, addGroup } = useApp();
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Calculate total owed/owing across all groups for the user
  const totalSpent = expenses
    .filter(e => e.payerId === currentUser?.id)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    addGroup(newGroupName, newGroupDesc);
    setShowNewGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your shared finances</p>
        </div>
        <Button onClick={() => setShowNewGroup(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-md">
          <Plus className="w-5 h-5" /> Create Group
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-l-teal-500 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-full text-teal-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Spent</p>
              <h3 className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Groups</p>
              <h3 className="text-3xl font-bold text-gray-900">{groups.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Groups</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(group => (
          <Link to={`/group/${group.id}`} key={group.id} className="block group">
            <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-teal-200 group-hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
                  <Wallet className="w-6 h-6 text-teal-600" />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  {new Date(group.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">{group.name}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-1">{group.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex -space-x-2">
                  {/* Mock avatars for group members */}
                  {[...Array(group.members.length)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                       {i+1}
                    </div>
                  ))}
                </div>
                <span className="flex items-center text-sm font-bold text-teal-600 group-hover:underline">
                  View Details <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Modal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} title="Create New Group">
        <form onSubmit={handleCreateGroup}>
          <Input label="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Japan Trip" required />
          <Input label="Description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="What's this for?" />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowNewGroup(false)}>Cancel</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Create Group</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// --- GROUP DETAILS ---

const GroupDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { groups, expenses, users, currentUser, addExpense, deleteExpense, getGroupBalances, updateGroup, removeMember, deleteGroup } = useApp();
  const navigate = useNavigate();

  const group = groups.find(g => g.id === id);
  const groupExpenses = expenses.filter(e => e.groupId === id);
  const balances = id ? getGroupBalances(id) : [];

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'manage'>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Manage Tab State
  const [groupName, setGroupName] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState('aB3xZ9pQ');

  // New Expense Form State (Detailed)
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expPayer, setExpPayer] = useState('');
  const [expSplitType, setExpSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [expCategory, setExpCategory] = useState<Expense['category']>('Other');
  const [isAllSelected, setIsAllSelected] = useState(true);
  
  // Participant State
  interface ParticipantState {
    userId: string;
    isChecked: boolean;
    shareAmount: number; // Calculated or manually entered
  }
  const [expParticipants, setExpParticipants] = useState<ParticipantState[]>([]);

  // Initialize form when opening modal
  useEffect(() => {
    if (showAddExpense && group && currentUser) {
      setExpPayer(currentUser.id);
      setExpAmount('');
      setExpDesc('');
      setExpDate(new Date().toISOString().split('T')[0]);
      setExpCategory('Other');
      setExpSplitType('EQUAL');
      
      // Initialize participants (all checked by default)
      const initialParticipants = users
        .filter(u => group.members.includes(u.id))
        .map(u => ({
          userId: u.id,
          isChecked: true,
          shareAmount: 0
        }));
      setExpParticipants(initialParticipants);
      setIsAllSelected(true);
    }
  }, [showAddExpense, group, currentUser, users]);

  useEffect(() => {
    if (group) setGroupName(group.name);
  }, [group]);

  const toggleSelectAll = () => {
    const newValue = !isAllSelected;
    setIsAllSelected(newValue);
    setExpParticipants(prev => prev.map(p => ({ ...p, isChecked: newValue })));
  };

  useEffect(() => {
    // Check if all selected to update the master checkbox state
    if (expParticipants.length > 0) {
        const all = expParticipants.every(p => p.isChecked);
        setIsAllSelected(all);
    }
  }, [expParticipants]);

  // --- SPLIT LOGIC ENGINE ---
  useEffect(() => {
    if (!showAddExpense) return;

    const total = parseFloat(expAmount) || 0;
    
    // Equal Split Logic with Penny Allocation
    if (expSplitType === 'EQUAL') {
      const activeMembers = expParticipants.filter(p => p.isChecked);
      const count = activeMembers.length;
      
      if (count > 0) {
        // Work in cents to avoid float issues
        const totalCents = Math.round(total * 100);
        const baseShareCents = Math.floor(totalCents / count);
        let remainderCents = totalCents % count;

        setExpParticipants(prev => prev.map(p => {
          if (!p.isChecked) return { ...p, shareAmount: 0 };
          
          let myShareCents = baseShareCents;
          // Distribute remainder penny by penny
          if (remainderCents > 0) {
            myShareCents += 1;
            remainderCents--;
          }
          
          return { ...p, shareAmount: myShareCents / 100 };
        }));
      } else {
        // No one selected
         setExpParticipants(prev => prev.map(p => ({ ...p, shareAmount: 0 })));
      }
    } 
    // Custom Split Logic: Only update if we need to reset (we don't overwrite manual inputs automatically here unless switching types)
  }, [expAmount, expSplitType, expParticipants.map(p => p.isChecked).join(',')]); // Recalculate when amount, type, or selection changes

  if (!group) return <div>Group not found</div>;

  const groupUsers = users.filter(u => group.members.includes(u.id));

  // Charts Data
  const chartData = groupExpenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) existing.value += curr.amount;
    else acc.push({ name: curr.category, value: curr.amount });
    return acc;
  }, [] as { name: string; value: number }[]);
  
  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(expAmount);
    if (isNaN(total) || total <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const activeParticipants = expParticipants.filter(p => p.isChecked);
    if (activeParticipants.length === 0) {
      alert("Please select at least one person to split with.");
      return;
    }

    // Validate Custom Split Sum
    if (expSplitType === 'CUSTOM') {
      const sum = activeParticipants.reduce((acc, p) => acc + p.shareAmount, 0);
      // Allow 1 cent drift due to potential float entry
      if (Math.abs(sum - total) > 0.01) {
        alert(`The split amounts ($${sum.toFixed(2)}) do not match the total ($${total.toFixed(2)}).`);
        return;
      }
    }

    const splits: Split[] = activeParticipants.map(p => ({
      userId: p.userId,
      amount: p.shareAmount
    }));

    addExpense({
      groupId: group.id,
      payerId: expPayer,
      description: expDesc,
      amount: total,
      date: expDate,
      category: expCategory,
      splitType: expSplitType,
      splits
    });

    setShowAddExpense(false);
  };

  // Helper for Custom Split Validations
  const currentSplitSum = expParticipants.filter(p => p.isChecked).reduce((sum, p) => sum + p.shareAmount, 0);
  const remainingAmount = (parseFloat(expAmount) || 0) - currentSplitSum;
  const isCustomInvalid = expSplitType === 'CUSTOM' && Math.abs(remainingAmount) > 0.01;

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    const answer = await analyzeGroupFinances(group, groupExpenses, users, aiQuestion);
    setAiResponse(answer);
    setIsAiLoading(false);
  };

  const handleUpdateGroup = () => {
    updateGroup(group.id, { name: groupName });
    alert('Group updated successfully!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://divisely.app/join/${inviteToken}`);
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const handleRevokeLink = () => {
    setInviteToken(Math.random().toString(36).substring(7));
    alert('Previous link revoked. New link generated.');
  };

  const handleDeleteGroup = () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroup(group.id);
      navigate('/dashboard');
    }
  };

  const isOwner = group.ownerId === currentUser?.id;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
             <span className="text-gray-300">/</span>
             <span className="text-teal-600 font-medium text-sm">{group.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => setShowAI(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 text-indigo-700 hover:shadow-sm">
            <Sparkles className="w-4 h-4" /> Smart Assistant
          </Button>
          <Button onClick={() => setShowAddExpense(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md">
            <Plus className="w-5 h-5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8">
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'expenses' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Expenses
          {activeTab === 'expenses' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'balances' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Balances
          {activeTab === 'balances' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'manage' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Manage
          {activeTab === 'manage' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>
      </div>

      {/* --- EXPENSES TAB --- */}
      {activeTab === 'expenses' && (
        <div className="animate-in fade-in duration-300">
           <Card className="overflow-hidden shadow-sm border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-gray-800">Expenses</h2>
              <span className="text-sm font-medium px-2 py-1 bg-white rounded border border-gray-200 text-gray-600">{groupExpenses.length} entries</span>
            </div>
            {groupExpenses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses yet</h3>
                <p>Add your first expense to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groupExpenses.map(expense => {
                  const payerUser = users.find(u => u.id === expense.payerId);
                  return (
                    <div key={expense.id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                      <div className="flex items-start gap-4">
                         <div className="mt-1 bg-teal-50 p-2.5 rounded-xl text-teal-600">
                           <Calendar className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-bold text-gray-900 text-lg">{expense.description}</p>
                           <p className="text-sm text-gray-500 mt-0.5">
                             <span className="font-medium text-gray-900">{payerUser?.name}</span> paid <span className="font-medium text-gray-900">${expense.amount.toFixed(2)}</span>
                           </p>
                           <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2 block">
                             {expense.category}
                           </span>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">${expense.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 font-medium">{expense.date}</p>
                         </div>
                         <button onClick={() => deleteExpense(expense.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* --- BALANCES TAB --- */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
           <Card className="p-6 shadow-sm border-gray-200">
             <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               <div className="p-1.5 bg-green-100 rounded-md">
                 <DollarSign className="w-4 h-4 text-green-600" /> 
               </div>
               Balances
             </h2>
             {balances.length > 0 ? (
               <InteractiveDebtGraph users={groupUsers} balances={balances} />
             ) : (
               <div className="text-center p-12 text-gray-500">Everyone is settled up!</div>
             )}
           </Card>

           <div className="space-y-6">
             <Card className="p-6 shadow-sm border-gray-200">
               <h2 className="font-bold text-gray-800 mb-6">Who owes whom?</h2>
               {balances.length === 0 ? (
                 <p className="text-gray-500 text-sm">No debts to show.</p>
               ) : (
                 <div className="space-y-4">
                   {balances.map((b, idx) => {
                     const fromUser = users.find(u => u.id === b.from);
                     const toUser = users.find(u => u.id === b.to);
                     return (
                       <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                         <div className="flex items-center gap-3">
                           <img src={fromUser?.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" />
                           <div className="text-sm">
                             <span className="font-bold text-gray-900 block">{fromUser?.name}</span>
                             <span className="text-xs text-gray-500">owes {toUser?.name}</span>
                           </div>
                         </div>
                         <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded text-sm">${b.amount.toFixed(2)}</span>
                       </div>
                     );
                   })}
                 </div>
               )}
             </Card>

             {chartData.length > 0 && (
                <Card className="p-6 flex flex-col shadow-sm border-gray-200">
                  <h2 className="font-bold text-gray-800 mb-4">Spending by Category</h2>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
             )}
           </div>
        </div>
      )}

      {/* --- MANAGE TAB --- */}
      {activeTab === 'manage' && (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
          
          {/* 1. Group Name */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Group Name</h3>
            <div className="flex gap-4">
              <input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                disabled={!isOwner}
              />
              {isOwner && (
                <Button onClick={handleUpdateGroup} className="bg-teal-500 hover:bg-teal-600">Save Changes</Button>
              )}
            </div>
          </Card>

          {/* 2. Members List */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <h3 className="text-lg font-bold text-gray-900">Members ({groupUsers.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {groupUsers.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-10 h-10 rounded-full border border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        {u.name}
                        {u.id === currentUser?.id && <span className="text-xs font-normal text-gray-500">(You)</span>}
                        {u.id === group.ownerId && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Owner</span>}
                      </p>
                    </div>
                  </div>
                  {isOwner && u.id !== currentUser?.id && (
                    <button 
                      onClick={() => removeMember(group.id, u.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Invite Link */}
          <Card className="p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-2">Invite Link</h3>
             <p className="text-sm text-gray-500 mb-4">Share this link with others to let them join the group. The link will expire in 7 days.</p>
             <div className="flex gap-2">
               <div className="flex-1 relative">
                 <input 
                   readOnly
                   value={`https://divisely.app/join/${inviteToken}`}
                   className="w-full pl-4 pr-10 py-3 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-mono text-sm focus:outline-none"
                 />
                 <button 
                   onClick={handleCopyLink}
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-teal-600 rounded-md transition-colors"
                 >
                   {inviteLinkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 </button>
               </div>
               {isOwner && (
                 <Button variant="secondary" onClick={handleRevokeLink}>Revoke Link</Button>
               )}
             </div>
          </Card>

          {/* 4. Danger Zone */}
          {isOwner && (
            <div className="mt-8">
              <h3 className="text-red-500 font-bold mb-4">Danger Zone</h3>
              <div className="border border-red-200 bg-red-50 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Delete Group</h4>
                  <p className="text-sm text-gray-600">Once you delete a group, there is no going back. Please be certain.</p>
                </div>
                <Button variant="danger" onClick={handleDeleteGroup} className="bg-red-500 hover:bg-red-600 text-white border-none shadow-sm">
                  Delete Group
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- NEW ADD EXPENSE MODAL --- */}
      <Modal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} title="" className="max-w-2xl bg-gray-50 p-0 overflow-hidden">
        {/* Custom Header to match design */}
        <div className="bg-white px-8 pt-8 pb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add a New Expense</h2>
            <p className="text-gray-500 mt-1">Fill in the details to add a new expense to the group.</p>
        </div>

        <form onSubmit={handleAddExpenseSubmit} className="p-8 space-y-6">
            
            {/* Main Details Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <input 
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="e.g., Dinner at The Italian Place"
                        value={expDesc}
                        onChange={e => setExpDesc(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                            <input 
                                type="number" step="0.01" min="0.01"
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                placeholder="0.00"
                                value={expAmount}
                                onChange={e => setExpAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Expense Date</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={expDate}
                                onChange={e => setExpDate(e.target.value)}
                            />
                            <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Paid By */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Paid by</label>
                    <div className="relative">
                        <select 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                            value={expPayer}
                            onChange={e => setExpPayer(e.target.value)}
                        >
                            {groupUsers.map(u => <option key={u.id} value={u.id}>{u.id === currentUser?.id ? 'You' : u.name}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="bg-gray-200 rounded-full p-1"><UserIcon className="w-3 h-3 text-gray-500" /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-900">Split between</h3>
                
                {/* Select All */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" 
                        />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                </div>

                {/* User List */}
                <div className="space-y-3">
                    {expParticipants.map((p, index) => {
                    const user = users.find(u => u.id === p.userId);
                    return (
                        <div key={p.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox"
                                    checked={p.isChecked}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setExpParticipants(prev => {
                                        const newArr = [...prev];
                                        newArr[index] = { ...newArr[index], isChecked: checked };
                                        return newArr;
                                        });
                                    }}
                                    className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                                />
                                <span className={`text-sm font-medium ${p.isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {user?.name}
                                </span>
                            </div>
                            <div className="font-medium text-gray-900 text-sm">
                                ${p.shareAmount.toFixed(2)}
                            </div>
                        </div>
                    )
                    })}
                </div>
                
                {/* Split Method Segmented Control */}
                <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Split method</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                        type="button"
                        onClick={() => setExpSplitType('EQUAL')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${expSplitType === 'EQUAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                        Equally
                        </button>
                        <button 
                        type="button"
                        onClick={() => setExpSplitType('CUSTOM')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${expSplitType === 'CUSTOM' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                        By Amount
                        </button>
                        <button 
                        type="button"
                        disabled
                        className="flex-1 py-1.5 text-sm font-medium rounded-md text-gray-300 cursor-not-allowed"
                        >
                        By Percentage
                        </button>
                    </div>
                </div>
                
                {/* Custom Input Area (Only visible if Custom) */}
                {expSplitType === 'CUSTOM' && (
                    <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                        {expParticipants.filter(p => p.isChecked).map((p, index) => {
                            const user = users.find(u => u.id === p.userId);
                            const realIndex = expParticipants.findIndex(x => x.userId === p.userId); // find original index
                            return (
                                <div key={p.userId} className="flex items-center justify-between gap-4">
                                    <label className="text-sm text-gray-600 flex-1 truncate">{user?.name}</label>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                        <input 
                                            type="number" step="0.01"
                                            value={p.shareAmount || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setExpParticipants(prev => {
                                                const newArr = [...prev];
                                                newArr[realIndex] = { ...newArr[realIndex], shareAmount: val };
                                                return newArr;
                                                });
                                            }}
                                            className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className={`p-4 rounded-lg flex items-center justify-between ${isCustomInvalid ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <div className="flex items-center gap-2">
                    {isCustomInvalid ? <AlertTriangle className="w-5 h-5" /> : <div className="bg-blue-200 p-0.5 rounded-full"><Check className="w-3 h-3 text-blue-700" /></div>}
                    <span className="font-medium text-sm">
                        {isCustomInvalid 
                        ? `Total split ($${currentSplitSum.toFixed(2)}) does not match expense ($${(parseFloat(expAmount)||0).toFixed(2)})` 
                        : 'Total split matches expense total'
                        }
                    </span>
                </div>
                <span className="font-bold text-lg">${(parseFloat(expAmount) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowAddExpense(false)}>Cancel</Button>
                <Button type="submit" disabled={isCustomInvalid} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
                Add Expense
                </Button>
            </div>

        </form>
      </Modal>

      {/* AI Assistant Modal (Same as before) */}
      <Modal isOpen={showAI} onClose={() => setShowAI(false)} title="Divisely Smart Assistant">
         <div className="flex flex-col h-[400px]">
           <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {aiResponse ? (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                     <Sparkles className="w-4 h-4" />
                   </div>
                   <div className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                     {aiResponse}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                   <div className="bg-indigo-50 p-4 rounded-full mb-3">
                     <MessageSquare className="w-8 h-8 text-indigo-300" />
                   </div>
                   <p className="text-sm font-medium text-gray-600">Ask anything about your group expenses!</p>
                   <p className="text-xs mt-2 text-gray-400">"Who spent the most on food?"<br/>"Summarize our trip expenses"</p>
                </div>
              )}
           </div>
           
           <div className="flex gap-2">
             <input 
               className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
               placeholder="Ask a question..."
               value={aiQuestion}
               onChange={e => setAiQuestion(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleAskAI()}
             />
             <Button onClick={handleAskAI} disabled={isAiLoading} className="w-12 flex items-center justify-center px-0 bg-indigo-600 hover:bg-indigo-700 text-white">
               {isAiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <ArrowRight className="w-5 h-5" />}
             </Button>
           </div>
         </div>
      </Modal>
    </>
  );
};

// --- APP ROOT ---

const AppContent = () => {
  const { currentUser } = useApp();
  
  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={currentUser ? <Layout><DashboardPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/group/:id" element={currentUser ? <Layout><GroupDetailsPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

const App = () => {
  const isBlob = window.location.protocol === 'blob:';
  const Router = isBlob ? MemoryRouter : HashRouter;

  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App;