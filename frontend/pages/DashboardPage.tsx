import React, { useState } from 'react';
import { Plus, Activity, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/UIComponents';
import { GroupCard } from '../components/groups/GroupCard';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';

export const DashboardPage = () => {
  const { groups, expenses, currentUser, addGroup } = useApp();
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Calculate total spent by current user
  const totalSpent = expenses
    .filter(e => e.payerId === currentUser?.id)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCreateGroup = (name: string, description: string) => {
    addGroup(name, description);
    setShowNewGroup(false);
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
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Spent</p>
              <h3 className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</h3>
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

      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Groups</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      <CreateGroupModal
        isOpen={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
};
