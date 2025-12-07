import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../UIComponents';
import { User } from '../../types';
import { Wallet, ArrowRightLeft } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupUsers: User[];
  currentUserId?: string;
  onSettleUp: (payload: { fromUserId: string; toUserId: string; amount: number }) => Promise<void> | void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  groupUsers,
  currentUserId,
  onSettleUp
}) => {
  const [fromUserId, setFromUserId] = useState<string>(currentUserId || '');
  const [toUserId, setToUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFromUserId(currentUserId || '');
      setToUserId('');
      setAmount('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!fromUserId || !toUserId) {
      alert('Please select both sender and receiver.');
      return;
    }
    if (fromUserId === toUserId) {
      alert('Sender and receiver must be different.');
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSettleUp({ fromUserId, toUserId, amount: amountNum });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to settle up. Please try again.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-xl p-0">
      <div className="flex flex-col max-h-[90vh]">
        <div className="bg-white px-8 pt-8 pb-6 flex-shrink-0 sticky top-0 z-10 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-teal-600" /> Settle Up
          </h2>
          <p className="text-gray-500 mt-1">Record a payment between group members.</p>
        </div>

        <div className="overflow-y-auto bg-gray-50 flex-1">
          <form id="settle-up-form" onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">From</label>
                <Select
                  value={fromUserId}
                  onChange={e => setFromUserId(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>
                    Select member
                  </option>
                  {groupUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To</label>
                <Select
                  value={toUserId}
                  onChange={e => setToUserId(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>
                    Select member
                  </option>
                  {groupUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                required
              />
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 bg-white border border-gray-100 rounded-lg p-4">
              <ArrowRightLeft className="w-4 h-4 text-teal-600" />
              <span>Record who paid whom and how much. Balances will update after saving.</span>
            </div>
          </form>
        </div>

        <div className="bg-white px-8 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="px-4">
            Cancel
          </Button>
          <Button type="submit" form="settle-up-form" className="bg-teal-600 hover:bg-teal-700 text-white px-4" disabled={isSubmitting}>
            {isSubmitting ? 'Settling...' : 'Settle Up'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
