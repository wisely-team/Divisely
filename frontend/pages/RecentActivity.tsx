import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Users, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../components/UIComponents';
import { activityService, Activity } from '../services/activityService';

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expense' | 'payment' | 'group'>('all');

  const fetchActivities = async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await activityService.getRecentActivities(token, pageNum, 20, filter);

      if (isLoadMore) {
        setActivities(prev => [...prev, ...response.activities]);
      } else {
        setActivities(response.activities);
      }

      setHasMore(response.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activities';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchActivities(1, false);
  }, [filter]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchActivities(page + 1, true);
    }
  };

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
              onClick={() => setFilter(tab.id as 'all' | 'expense' | 'payment' | 'group')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading activities...</p>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load activities</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchActivities(1, false)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Activity Timeline */}
        {!loading && !error && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet</h3>
                <p className="text-gray-500">Start by creating a group or adding an expense</p>
              </Card>
            ) : (
              activities.map((activity) => (
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
        )}

        {/* Load More */}
        {!loading && !error && activities.length > 0 && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                'Load More Activities'
              )}
            </button>
          </div>
        )}

        {/* No more activities message */}
        {!loading && !error && activities.length > 0 && !hasMore && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">No more activities to load</p>
          </div>
        )}
      </div>
    </>
  );
}
