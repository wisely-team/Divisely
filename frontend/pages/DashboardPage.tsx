import React, { useState } from 'react';
import { Plus, Activity, Users, ArrowDown, ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/UIComponents';
import { GroupCard } from '../components/groups/GroupCard';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';

export const DashboardPage = () => {
  const { groups, expenses, currentUser, addGroup, getGroupBalances } = useApp();
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Calculate total balance of current user
  const allgroups = groups.filter(g => g.members.includes(currentUser?.id || ''));
  const balances = allgroups.flatMap(group => getGroupBalances(group.id));

  const i_owe = balances
    .filter(b => b.from === currentUser?.id)
    .reduce((sum, b) => sum + b.amount, 0);

  const i_am_owed = balances
    .filter(b => b.to === currentUser?.id)
    .reduce((sum, b) => sum + b.amount, 0);

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      await addGroup(name, description);
      setShowNewGroup(false);
    } catch (error) {
      console.error('Create group failed', error);
      throw error;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your shared finances</p>
        </div>
        <Button
          onClick={() => setShowNewGroup(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-md"
        >
          <Plus className="w-5 h-5" /> Create Group
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <ArrowDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">You Owe</p>
              <h3 className="text-3xl font-bold text-red-900">-${i_owe.toFixed(2)}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <ArrowUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">You Are Owed</p>
              <h3 className="text-3xl font-bold text-green-900">+${i_am_owed.toFixed(2)}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Groups</p>
              <h3 className="text-3xl font-bold text-gray-900">{groups.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 mt-1">List of groups you are a member of</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-500">No groups yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
};
