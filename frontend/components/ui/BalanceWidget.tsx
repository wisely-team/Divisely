import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { UserBalance } from '../../types';

interface BalanceWidgetProps {
  balance: UserBalance | null;
  loading?: boolean;
}

export const BalanceWidget: React.FC<BalanceWidgetProps> = ({ balance, loading }) => {
  if (loading) {
    return (
      <div className="px-4 py-3 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const isPositive = balance.netBalance >= 0;

  return (
    <div className="px-4 py-3 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg border border-teal-200">
      <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
        Your Balance
      </div>

      <div className="space-y-1.5">
        {/* Total Owed (Green - Positive) */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <span>You are owed:</span>
          </div>
          <span className="font-semibold text-green-700">
            {formatCurrency(balance.totalOwed)}
          </span>
        </div>

        {/* Total Debt (Red - Negative) */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <span>You owe:</span>
          </div>
          <span className="font-semibold text-red-700">
            {formatCurrency(balance.totalDebt)}
          </span>
        </div>

        {/* Net Balance */}
        <div className="pt-2 mt-2 border-t border-teal-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">Net Balance:</span>
            <span
              className={`text-base font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isPositive ? '+' : ''}{formatCurrency(balance.netBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
