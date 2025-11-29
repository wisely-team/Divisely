import React from 'react';
import { Calendar, DollarSign, Trash2 } from 'lucide-react';
import { Expense, User } from '../../types';
import { Card } from '../UIComponents';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, users, onDeleteExpense }) => {
  if (expenses.length === 0) {
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
          {expenses.length} entries
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {expenses.map(expense => {
          const payerUser = users.find(u => u.id === expense.payerId);
          return (
            <div key={expense.id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center group">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-50 p-2.5 rounded-xl text-teal-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{expense.description}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-900">{payerUser?.name}</span> paid{' '}
                    <span className="font-medium text-gray-900">${expense.amount.toFixed(2)}</span>
                  </p>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2 block">
                    {expense.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">${expense.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 font-medium">{expense.date}</p>
                </div>
                <button
                  onClick={() => onDeleteExpense(expense.id)}
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
