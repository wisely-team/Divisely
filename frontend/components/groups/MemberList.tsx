import React from 'react';
import { User } from '../../types';
import { Card } from '../UIComponents';

interface MemberListProps {
  members: User[];
  ownerId: string;
  currentUserId: string;
  isOwner: boolean;
  onRemoveMember: (userId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  ownerId,
  currentUserId,
  isOwner,
  onRemoveMember
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Members ({members.length})</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {members.map(user => (
          <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt={user.name} />
              <div>
                <p className="font-bold text-gray-900 flex items-center gap-2">
                  {user.name}
                  {user.id === currentUserId && <span className="text-xs font-normal text-gray-500">(You)</span>}
                  {user.id === ownerId && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Owner
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Remove member intentionally disabled */}
          </div>
        ))}
      </div>
    </Card>
  );
};
