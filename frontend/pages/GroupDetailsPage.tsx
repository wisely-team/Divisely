import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Sparkles, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/UIComponents';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { InteractiveDebtGraph } from '../components/expenses/InteractiveDebtGraph';
import { BalanceList } from '../components/expenses/BalanceList';
import { CategoryPieChart } from '../components/expenses/CategoryPieChart';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { AIAssistantModal } from '../components/expenses/AIAssistantModal';
import { MemberList } from '../components/groups/MemberList';
import { InviteLink } from '../components/groups/InviteLink';
import { Expense } from '../types';

export const GroupDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { groups, expenses, users, currentUser, addExpense, deleteExpense, getGroupBalances, updateGroup, removeMember, deleteGroup } =
    useApp();
  const navigate = useNavigate();

  const group = groups.find(g => g.id === id);
  const groupExpenses = expenses.filter(e => e.groupId === id);
  const balances = id ? getGroupBalances(id) : [];

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'manage'>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [groupName, setGroupName] = useState('');

  React.useEffect(() => {
    if (group) setGroupName(group.name);
  }, [group]);

  if (!group) return <div>Group not found</div>;

  const groupUsers = users.filter(u => group.members.includes(u.id));

  // Charts Data
  const chartData = groupExpenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) existing.value += curr.amount;
    else acc.push({ name: curr.category, value: curr.amount });
    return acc;
  }, [] as { name: string; value: number }[]);

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    addExpense(expense);
    setShowAddExpense(false);
  };

  const handleUpdateGroup = () => {
    updateGroup(group.id, { name: groupName });
    alert('Group updated successfully!');
  };

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
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
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-teal-600 font-medium text-sm">{group.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 text-indigo-700 hover:shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Smart Assistant
          </Button>
          <Button onClick={() => setShowAddExpense(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md">
            <Plus className="w-5 h-5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8">
        {(['expenses', 'balances', 'manage'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
          </button>
        ))}
      </div>

      {/* --- EXPENSES TAB --- */}
      {activeTab === 'expenses' && (
        <div className="animate-in fade-in duration-300">
          <ExpenseList expenses={groupExpenses} users={users} onDeleteExpense={deleteExpense} />
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
              <BalanceList balances={balances} users={users} />
            </Card>

            {chartData.length > 0 && (
              <Card className="p-6 flex flex-col shadow-sm border-gray-200">
                <h2 className="font-bold text-gray-800 mb-4">Spending by Category</h2>
                <CategoryPieChart data={chartData} />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* --- MANAGE TAB --- */}
      {activeTab === 'manage' && (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
          {/* Group Name */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Group Name</h3>
            <div className="flex gap-4">
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                disabled={!isOwner}
              />
              {isOwner && (
                <Button onClick={handleUpdateGroup} className="bg-teal-500 hover:bg-teal-600">
                  Save Changes
                </Button>
              )}
            </div>
          </Card>

          {/* Members List */}
          <MemberList
            members={groupUsers}
            ownerId={group.ownerId}
            currentUserId={currentUser?.id || ''}
            isOwner={isOwner}
            onRemoveMember={userId => removeMember(group.id, userId)}
          />

          {/* Invite Link */}
          <InviteLink groupId={group.id} isOwner={isOwner} />

          {/* Danger Zone */}
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

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupUsers={groupUsers}
        currentUserId={currentUser?.id || ''}
        onAddExpense={handleAddExpense}
        groupId={group.id}
      />

      <AIAssistantModal isOpen={showAI} onClose={() => setShowAI(false)} group={group} expenses={groupExpenses} users={users} />
    </>
  );
};
