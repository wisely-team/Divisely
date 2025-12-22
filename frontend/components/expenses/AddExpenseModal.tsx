import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Check, User as UserIcon } from 'lucide-react';
import { Modal, Button } from '../UIComponents';
import { Expense, User, Split } from '../../types';
import { calculateEqualSplit, validateCustomSplit } from '../../utils/calculations';
import { ReceiptScanner } from './ReceiptScanner';
import { ChevronDown } from 'lucide-react';

interface ParticipantState {
  userId: string;
  isChecked: boolean;
  shareAmount: number;
  sharePercentage: number;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupUsers: User[];
  currentUserId: string;
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<unknown>;
  groupId: string;
  mode?: 'add' | 'edit';
  initialExpense?: Expense | null;
  onSubmitExpense?: (expense: Omit<Expense, 'id'>) => Promise<unknown>;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groupUsers,
  currentUserId,
  onAddExpense,
  groupId,
  mode = 'add',
  initialExpense,
  onSubmitExpense
}) => {
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expPayer, setExpPayer] = useState(currentUserId);
  const [expSplitType, setExpSplitType] = useState<'EQUAL' | 'CUSTOM' | 'PERCENTAGE'>('EQUAL');
  const [isAllSelected, setIsAllSelected] = useState(true);
  const [expParticipants, setExpParticipants] = useState<ParticipantState[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const participantSelectionKey = expParticipants.map(p => `${p.userId}-${p.isChecked}`).join('|');

  // Initialize form when opening modal
  useEffect(() => {
    if (isOpen) {
      const hasInitial = initialExpense && mode === 'edit';
      const initialAmount = hasInitial ? initialExpense!.amount : 0;
      const splitMap = hasInitial
        ? new Map(initialExpense!.splits.map(s => [s.userId, s.amount]))
        : new Map<string, number>();

      setExpPayer(hasInitial ? initialExpense!.payerId : currentUserId);
      setExpAmount(hasInitial ? initialExpense!.amount.toString() : '');
      setExpDesc(hasInitial ? initialExpense!.description : '');
      setExpDate(hasInitial ? (initialExpense!.date?.split('T')[0] || initialExpense!.date) : new Date().toISOString().split('T')[0]);
      setExpSplitType(hasInitial ? initialExpense!.splitType : 'EQUAL');
      setScanError(null);

      const initialParticipants = groupUsers.map(u => {
        const shareAmount = splitMap.get(u.id) || 0;
        const isChecked = hasInitial ? splitMap.has(u.id) : true;
        const percentage = hasInitial && initialAmount > 0 ? (shareAmount / initialAmount) * 100 : 0;
        return {
          userId: u.id,
          isChecked,
          shareAmount,
          sharePercentage: percentage
        };
      });

      if (hasInitial) {
        const missingSplits = initialExpense!.splits.filter(s => !groupUsers.some(u => u.id === s.userId));
        missingSplits.forEach(split => {
          const shareAmount = split.amount;
          const percentage = initialAmount > 0 ? (shareAmount / initialAmount) * 100 : 0;
          initialParticipants.push({
            userId: split.userId,
            isChecked: true,
            shareAmount,
            sharePercentage: percentage
          });
        });
      }

      setExpParticipants(initialParticipants);
      setIsAllSelected(initialParticipants.every(p => p.isChecked));
    }
  }, [isOpen, currentUserId, groupUsers, initialExpense, mode]);

  const handleReceiptScan = (data: { description: string; amount: number; date: string }) => {
    setExpDesc(data.description);
    setExpDate(data.date);
    setScanError(null);

    // Set amount last - this will trigger the useEffect to recalculate splits
    setExpAmount(data.amount.toString());
  };

  const handleScanError = (error: string) => {
    setScanError(error);
  };

  const toggleSelectAll = () => {
    const newValue = !isAllSelected;
    setIsAllSelected(newValue);

    if (expSplitType === 'EQUAL' && expAmount) {
      const total = parseFloat(expAmount);
      if (!isNaN(total) && total > 0) {
        const count = newValue ? expParticipants.length : 0;

        if (count > 0) {
          const shares = calculateEqualSplit(total, count);
          setExpParticipants(prev => prev.map((p, idx) => ({
            ...p,
            isChecked: newValue,
            shareAmount: shares[idx]
          })));
        } else {
          setExpParticipants(prev => prev.map(p => ({
            ...p,
            isChecked: newValue,
            shareAmount: 0
          })));
        }
        return;
      }
    }

    setExpParticipants(prev => prev.map(p => ({ ...p, isChecked: newValue })));
  };

  // Update "Select All" checkbox state
  useEffect(() => {
    if (expParticipants.length > 0) {
      const all = expParticipants.every(p => p.isChecked);
      setIsAllSelected(all);
    }
  }, [expParticipants]);

  // Equal Split Logic - Recalculate when amount or split type changes
  useEffect(() => {
    if (!isOpen) return;
    if (expSplitType !== 'EQUAL') return;
    if (!expAmount) return;

    const total = parseFloat(expAmount);
    if (isNaN(total) || total <= 0) return;

    // Use functional update to get the latest participants state
    setExpParticipants(prev => {
      if (prev.length === 0) return prev; // Don't update if not initialized

      const activeMembers = prev.filter(p => p.isChecked);
      const count = activeMembers.length;

      if (count > 0) {
        const shares = calculateEqualSplit(total, count);
        let shareIndex = 0;

        return prev.map(p => {
          if (!p.isChecked) return { ...p, shareAmount: 0 };
          const share = shares[shareIndex++];
          return { ...p, shareAmount: share };
        });
      } else {
        return prev.map(p => ({ ...p, shareAmount: 0 }));
      }
    });
  }, [expAmount, expSplitType, isOpen]);

  // Percentage Split Logic - Recalculate amounts when percentages or total changes
  useEffect(() => {
    if (!isOpen) return;
    if (expSplitType !== 'PERCENTAGE') return;
    if (!expAmount) return;

    const total = parseFloat(expAmount);
    if (isNaN(total) || total <= 0) return;

    setExpParticipants(prev => {
      return prev.map(p => {
        if (!p.isChecked) return { ...p, shareAmount: 0 };
        const amount = (total * p.sharePercentage) / 100;
        return { ...p, shareAmount: amount };
      });
    });
  }, [expAmount, expSplitType, isOpen, participantSelectionKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(expAmount);
    if (isNaN(total) || total <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const activeParticipants = expParticipants.filter(p => p.isChecked);
    if (activeParticipants.length === 0) {
      alert('Please select at least one person to split with.');
      return;
    }

    // Validate Custom Split Sum
    if (expSplitType === 'CUSTOM') {
      const splits: Split[] = activeParticipants.map(p => ({
        userId: p.userId,
        amount: p.shareAmount
      }));

      if (!validateCustomSplit(splits, total)) {
        const sum = splits.reduce((acc, s) => acc + s.amount, 0);
        alert(`The split amounts ($${sum.toFixed(2)}) do not match the total ($${total.toFixed(2)}).`);
        return;
      }
    }

    // Validate Percentage Split Sum
    if (expSplitType === 'PERCENTAGE') {
      const totalPercentage = activeParticipants.reduce((sum, p) => sum + (p.sharePercentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`The percentages must add up to 100%. Currently: ${totalPercentage.toFixed(2)}%`);
        return;
      }
    }

    const splits: Split[] = activeParticipants.map(p => ({
      userId: p.userId,
      amount: p.shareAmount
    }));

    try {
      const submitter = onSubmitExpense || onAddExpense;
      await submitter({
        groupId,
        payerId: expPayer,
        description: expDesc,
        amount: total,
        date: expDate,
        splitType: expSplitType,
        splits
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add expense. Please try again.';
      alert(message);
    }
  };

  const currentSplitSum = expParticipants.filter(p => p.isChecked).reduce((sum, p) => sum + (p.shareAmount || 0), 0);
  const remainingAmount = (parseFloat(expAmount) || 0) - currentSplitSum;
  const currentPercentageSum = expParticipants.filter(p => p.isChecked).reduce((sum, p) => sum + (p.sharePercentage || 0), 0);
  const isCustomInvalid = expSplitType === 'CUSTOM' && Math.abs(remainingAmount) > 0.01;
  const isPercentageInvalid = expSplitType === 'PERCENTAGE' && Math.abs(currentPercentageSum - 100) > 0.01;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-2xl p-0">
      <div className="flex flex-col max-h-[90vh]">
        {/* Custom Header - Sticky */}
        <div className="bg-white px-8 pt-8 pb-6 flex-shrink-0 sticky top-0 z-10 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{mode === 'edit' ? 'Edit Expense' : 'Add a New Expense'}</h2>
          <p className="text-gray-500 mt-1">{mode === 'edit' ? 'Update the details and save changes.' : 'Fill in the details to add a new expense to the group.'}</p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto bg-gray-50 flex-1">
          <form id="add-expense-form" onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Receipt Scanner */}
        <ReceiptScanner onScanComplete={handleReceiptScan} onError={handleScanError} />

        {/* Error Alert */}
        {scanError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{scanError}</p>
              <p className="text-xs text-red-600 mt-1">You can still fill in the details manually below.</p>
            </div>
          </div>
        )}

        {/* Main Details Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Description</label>
            <input
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="e.g., Dinner at The Italian Place"
              value={expDesc}
              onChange={e => setExpDesc(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="0.00"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Expense Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Paid by</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                value={expPayer}
                onChange={e => setExpPayer(e.target.value)}
              >
                {groupUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.id === currentUserId ? 'You' : u.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="bg-gray-200 rounded-full p-1">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Split Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <h3 className="font-bold text-gray-900">Split between</h3>

          {/* Select All */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Select All</span>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {expParticipants.map((p, index) => {
              const user = groupUsers.find(u => u.id === p.userId);
              return (
                <div key={p.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={p.isChecked}
                      onChange={e => {
                        const checked = e.target.checked;

                        // Update checked state
                        setExpParticipants(prev => {
                          const newArr = [...prev];
                          newArr[index] = { ...newArr[index], isChecked: checked };

                          // Recalculate splits if EQUAL mode
                          if (expSplitType === 'EQUAL' && expAmount) {
                            const total = parseFloat(expAmount);
                            if (!isNaN(total) && total > 0) {
                              const activeCount = newArr.filter(x => x.isChecked).length;

                              if (activeCount > 0) {
                                const shares = calculateEqualSplit(total, activeCount);
                                let shareIdx = 0;

                                return newArr.map(x => ({
                                  ...x,
                                  shareAmount: x.isChecked ? shares[shareIdx++] : 0
                                }));
                              }
                            }
                          }

                          return newArr;
                        });
                      }}
                      className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className={`text-sm font-medium ${p.isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                      {user?.name || 'Unknown member'}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">${(p.shareAmount || 0).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* Split Method Segmented Control */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Split method</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setExpSplitType('EQUAL')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  expSplitType === 'EQUAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Equally
              </button>
              <button
                type="button"
                onClick={() => setExpSplitType('CUSTOM')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  expSplitType === 'CUSTOM' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                By Amount
              </button>
              <button
                type="button"
                onClick={() => setExpSplitType('PERCENTAGE')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  expSplitType === 'PERCENTAGE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                By Percentage
              </button>
            </div>
          </div>

          {/* Custom Input Area */}
          {expSplitType === 'CUSTOM' && (
            <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
              {expParticipants
                .filter(p => p.isChecked)
                .map(p => {
                  const user = groupUsers.find(u => u.id === p.userId);
                  const realIndex = expParticipants.findIndex(x => x.userId === p.userId);
                  return (
                    <div key={p.userId} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-600 flex-1 truncate">{user?.name}</label>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={p.shareAmount || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setExpParticipants(prev => {
                              const newArr = [...prev];
                              newArr[realIndex] = { ...newArr[realIndex], shareAmount: val };
                              return newArr;
                            });
                          }}
                          className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Percentage Input Area */}
          {expSplitType === 'PERCENTAGE' && (
            <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
              {expParticipants
                .filter(p => p.isChecked)
                .map(p => {
                  const user = groupUsers.find(u => u.id === p.userId);
                  const realIndex = expParticipants.findIndex(x => x.userId === p.userId);
                  return (
                    <div key={p.userId} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-600 flex-1 truncate">{user?.name}</label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={p.sharePercentage || ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setExpParticipants(prev => {
                                const newArr = [...prev];
                                const total = parseFloat(expAmount) || 0;
                                const amount = (total * val) / 100;
                                newArr[realIndex] = { ...newArr[realIndex], sharePercentage: val, shareAmount: amount };
                                return newArr;
                              });
                            }}
                            className="w-full pl-3 pr-7 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                        <span className="text-sm text-gray-500 w-20 text-right">${(p.shareAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-medium">
                <span className="text-gray-700">Total</span>
                <div className="flex items-center gap-2">
                  <span className={`w-24 text-right ${
                    Math.abs(expParticipants.filter(p => p.isChecked).reduce((sum, p) => sum + (p.sharePercentage || 0), 0) - 100) > 0.01
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {expParticipants.filter(p => p.isChecked).reduce((sum, p) => sum + (p.sharePercentage || 0), 0).toFixed(2)}%
                  </span>
                  <span className="text-gray-900 w-20 text-right">${currentSplitSum.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

          </form>
        </div>

        {/* Sticky Footer */}
        <div className="bg-white border-t border-gray-200 px-8 py-4 flex-shrink-0 sticky bottom-0 z-10 space-y-4">
          {/* Footer Info */}
          <div
            className={`p-4 rounded-lg flex items-center justify-between ${
              isCustomInvalid || isPercentageInvalid ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCustomInvalid || isPercentageInvalid ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <div className="bg-blue-200 p-0.5 rounded-full">
                  <Check className="w-3 h-3 text-blue-700" />
                </div>
              )}
              <span className="font-medium text-sm">
                {isCustomInvalid
                  ? `Total split ($${currentSplitSum.toFixed(2)}) does not match expense ($${(parseFloat(expAmount) || 0).toFixed(2)})`
                  : isPercentageInvalid
                  ? `Total percentage (${currentPercentageSum.toFixed(0)}%) must equal 100%`
                  : 'Total split matches expense total'}
              </span>
            </div>
            <span className="font-bold text-lg">${(parseFloat(expAmount) || 0).toFixed(2)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-expense-form"
              disabled={isCustomInvalid || isPercentageInvalid}
              className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
            >
              {mode === 'edit' ? 'Save changes' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
