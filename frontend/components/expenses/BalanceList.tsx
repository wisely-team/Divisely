import React from 'react';
import { User } from '../../types';

interface Balance {
  from: string;
  to: string;
  amount: number;
}

interface BalanceListProps {
  balances: Balance[];
  users: User[];
}

export const BalanceList: React.FC<BalanceListProps> = ({ balances, users }) => {
  if (balances.length === 0) {
    return <p className="text-gray-500 text-sm">No debts to show.</p>;
  }

  return (
    <div className="space-y-4">
      {balances.map((b, idx) => {
        const fromUser = users.find(u => u.id === b.from);
        const toUser = users.find(u => u.id === b.to);
        return (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <img src={fromUser?.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt={fromUser?.name} />
              <div className="text-sm">
                <span className="font-bold text-gray-900 block">{fromUser?.name}</span>
                <span className="text-xs text-gray-500">owes {toUser?.name}</span>
              </div>
            </div>
            <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded text-sm">
              ${b.amount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
