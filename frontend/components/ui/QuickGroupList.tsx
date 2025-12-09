import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import type { GroupSummary } from '../../types';

interface QuickGroupListProps {
  groups: GroupSummary[];
  loading?: boolean;
  onCloseSidebar?: () => void;
}

export const QuickGroupList: React.FC<QuickGroupListProps> = ({
  groups,
  loading,
  onCloseSidebar,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No groups yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
      {groups.map((group) => (
        <Link
          key={group.id}
          to={`/groups/${group.id}`}
          onClick={onCloseSidebar}
          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors group"
        >
          <Users className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
          <span className="flex-1 text-sm font-medium truncate">{group.name}</span>

          {/* Notification Badge */}
          {group.unreadCount && group.unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {group.unreadCount > 9 ? '9+' : group.unreadCount}
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500" />
        </Link>
      ))}

    </div>
  );
};
