import React from 'react';
import { Calendar, DollarSign, Trash2 } from 'lucide-react';
import { Expense, Settlement, User } from '../../types';
import { Card } from '../UIComponents';

type TransactionItem =
  | ({ type: 'expense' } & Pick<Expense, 'id' | 'description' | 'amount' | 'date' | 'payerId' | 'splits' | 'myShare' | 'isBorrow' | 'createdAt'>)
  | ({ type: 'settlement' } & Pick<Settlement, 'id' | 'description' | 'amount' | 'settledAt' | 'note' | 'createdAt'> & { date: string; fromUserId?: string; toUserId?: string });

interface ExpenseListProps {
  transactions: TransactionItem[];
  users: User[];
  onDeleteExpense: (expenseId: string) => Promise<void> | void;
  onDeleteSettlement?: (settlementId: string) => Promise<void> | void;
  currentUserId?: string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ transactions, users, onDeleteExpense, onDeleteSettlement, currentUserId }) => {
  if (transactions.length === 0) {
    return (
      <Card className="overflow-hidden shadow-sm border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800">Expenses</h2>
          <span className="text-sm font-medium px-2 py-1 bg-white rounded border border-gray-200 text-gray-600">0 entries</span>
        </div>
        <div className="p-12 text-center text-gray-500">
          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses yet</h3>
          <p>Add your first expense to get started!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="font-bold text-gray-800">Expenses</h2>
        <span className="text-sm font-medium px-2 py-1 bg-white rounded border border-gray-200 text-gray-600">
          {transactions.length} entries
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {transactions.map(item => {
          const isSettlement = item.type === 'settlement';
          const payerUser = !isSettlement ? users.find(u => u.id === item.payerId) : undefined;
          const fromUser = isSettlement ? users.find(u => u.id === item.fromUserId) : undefined;
          const toUser = isSettlement ? users.find(u => u.id === item.toUserId) : undefined;

          const myShareFromExpense = !isSettlement && typeof item.myShare === 'number'
            ? item.myShare
            : (!isSettlement && currentUserId ? item.splits.find(s => s.userId === currentUserId)?.amount ?? 0 : 0);
          const isBorrow = !isSettlement && (typeof item.isBorrow === 'boolean' ? item.isBorrow : currentUserId ? currentUserId !== item.payerId : undefined);
          const isBorrowFlag = !isSettlement && typeof isBorrow === 'boolean' ? isBorrow : null;
          const hasShare = !isSettlement && myShareFromExpense > 0;
          const displayAmount = isSettlement
            ? item.amount
            : (typeof isBorrow === 'boolean'
              ? (isBorrow ? myShareFromExpense : item.amount - myShareFromExpense)
              : item.amount);
          const formattedAmount = isSettlement ? Math.max(0, item.amount || 0) : (hasShare ? Math.max(0, displayAmount || 0) : 0);
          const amountColor = isSettlement
            ? 'text-blue-600'
            : hasShare
              ? (isBorrowFlag === null ? 'text-gray-900' : isBorrowFlag ? 'text-red-600' : 'text-green-600')
              : 'text-gray-400';
          const amountLabel = isSettlement
            ? 'Settlement'
            : hasShare
              ? (isBorrowFlag === null ? '' : isBorrowFlag ? 'You borrow' : 'You lent')
              : 'You are not involved';
          const payerLabel = isSettlement
            ? `From ${fromUser?.name || fromUser?.email || 'Someone'} to ${toUser?.name || toUser?.email || 'someone'}`
            : currentUserId && payerUser?.id === currentUserId
              ? 'You paid'
              : `${payerUser?.name || 'Someone'} paid`;
          const description = isSettlement ? (item.description || item.note || 'Settlement') : item.description;
          let dateString = isSettlement ? item.settledAt || item.date : item.date;
          dateString = dateString.split('T')[0]; // Extract date part only
          return (
            <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center group">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-50 p-2.5 rounded-xl text-teal-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{description}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-900">{payerLabel}</span>{' '}
                    {!isSettlement && <span className="font-medium text-gray-900">${item.amount.toFixed(2)}</span>}
                    {isSettlement && <span className="font-medium text-blue-700">${item.amount.toFixed(2)}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`font-bold text-lg ${amountColor}`}>${formattedAmount.toFixed(2)}</p>
                  {amountLabel && (
                    <p className={`text-xs font-medium ${
                      isSettlement
                        ? 'text-blue-500'
                        : hasShare
                          ? (isBorrowFlag ? 'text-red-500' : 'text-green-500')
                          : 'text-gray-400'
                    }`}>
                      {amountLabel}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 font-medium">{dateString}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (isSettlement) {
                        await onDeleteSettlement?.(item.id);
                      } else {
                        await onDeleteExpense(item.id);
                      }
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Failed to delete';
                      alert(message);
                    }
                  }}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
