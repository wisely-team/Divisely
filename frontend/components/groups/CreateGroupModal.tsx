import React, { useEffect, useState } from 'react';
import { Modal, Input, Button } from '../UIComponents';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreateGroup(groupName, groupDescription);
      setGroupName('');
      setGroupDescription('');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit}>
        <Input
          label="Group Name"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="e.g. Japan Trip"
          required
          disabled={isSubmitting}
        />
        <Input
          label="Description"
          value={groupDescription}
          onChange={e => setGroupDescription(e.target.value)}
          placeholder="What's this for?"
          disabled={isSubmitting}
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
