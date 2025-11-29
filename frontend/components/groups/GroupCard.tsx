import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { Group } from '../../types';
import { Card } from '../UIComponents';
import { useApp } from '@/context/AppContext';

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const { currentUser, getGroupBalances } = useApp();
  const balance = getGroupBalances(group.id).reduce((acc, b) => {
    if (b.from === currentUser?.id) return acc - b.amount;
    if (b.to === currentUser?.id) return acc + b.amount;
    return acc;
  }, 0);
  return (
    <Link to={`/group/${group.id}`} className="block group">
      <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-teal-200 group-hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
            <Wallet className="w-6 h-6 text-teal-600" />
          </div>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
            {new Date(group.created_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
          {group.name}
        </h3>
        <p className="text-gray-500 text-sm mb-1 line-clamp-1">{group.description}</p>
        {balance > 0 ? (
          <p className="text-green-600 text-sm mb-0">You are owed ${balance.toFixed(2)}</p>
        ) : balance < 0 ? (
          <p className="text-red-600 text-sm mb-0">You owe ${Math.abs(balance).toFixed(2)}</p>
        ) : (
          <p className="text-gray-700 text-sm mb-0">All settled up</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex -space-x-2">
            {[...Array(group.members.length)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <span className="flex items-center text-sm font-bold text-teal-600 group-hover:underline">
            View Details <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      </Card>
    </Link>
  );
};
