import React, { useState } from 'react';
import { Clock, DollarSign, Users, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card } from '../components/UIComponents';

interface Activity {
  id: string;
  type: 'expense' | 'payment' | 'group_created' | 'member_added';
  description: string;
  amount?: number;
  groupName: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
}

export default function RecentActivity() {
  // Mock data - Replace with real API call
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'expense',
      description: 'added an expense "Dinner at Italian Restaurant"',
      amount: 125.50,
      groupName: 'Japan Trip',
      userName: 'Alice Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      timestamp: '2025-01-09T10:30:00',
    },
    {
      id: '2',
      type: 'payment',
      description: 'settled up',
      amount: 50.00,
      groupName: 'Home Expenses',
      userName: 'Bob Smith',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      timestamp: '2025-01-09T09:15:00',
    },
    {
      id: '3',
      type: 'member_added',
      description: 'joined the group',
      groupName: 'Pizza Friday',
      userName: 'Charlie Brown',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
      timestamp: '2025-01-08T18:45:00',
    },
    {
      id: '4',
      type: 'group_created',
      description: 'created the group',
      groupName: 'Weekend Getaway',
      userName: 'Diana Prince',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
      timestamp: '2025-01-08T14:20:00',
    },
    {
      id: '5',
      type: 'expense',
      description: 'added an expense "Uber to Airport"',
      amount: 35.75,
      groupName: 'Japan Trip',
      userName: 'Evan Davis',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evan',
      timestamp: '2025-01-07T22:10:00',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'expense' | 'payment' | 'group'>('all');

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'expense') return activity.type === 'expense';
    if (filter === 'payment') return activity.type === 'payment';
    if (filter === 'group') return activity.type === 'group_created' || activity.type === 'member_added';
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'expense':
        return <DollarSign className="w-5 h-5 text-red-600" />;
      case 'payment':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'group_created':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'member_added':
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'expense':
        return 'bg-red-50 border-red-100';
      case 'payment':
        return 'bg-green-50 border-green-100';
      case 'group_created':
        return 'bg-blue-50 border-blue-100';
      case 'member_added':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recent Activity</h1>
            <p className="text-gray-500 mt-1">Stay up to date with your group activities</p>
          </div>
          <Clock className="w-8 h-8 text-teal-600" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'expense', label: 'Expenses' },
            { id: 'payment', label: 'Payments' },
            { id: 'group', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-500">Start by creating a group or adding an expense</p>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card
                key={activity.id}
                className={`p-5 border-l-4 ${getActivityColor(activity.type)} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* User Avatar */}
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  />

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">{activity.userName}</span>{' '}
                          <span className="text-gray-600">{activity.description}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            {activity.groupName}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      {activity.amount && (
                        <div className="flex-shrink-0">
                          <div
                            className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${activity.type === 'payment'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {activity.type === 'payment' ? '+' : '-'}$
                            {activity.amount.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredActivities.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors">
              Load More Activities
            </button>
          </div>
        )}
      </div>
    </>
  );
}
