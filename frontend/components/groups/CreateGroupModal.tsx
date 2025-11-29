import React, { useState } from 'react';
import { Modal, Input, Button } from '../UIComponents';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGroup(groupName, groupDescription);
    setGroupName('');
    setGroupDescription('');
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
        />
        <Input
          label="Description"
          value={groupDescription}
          onChange={e => setGroupDescription(e.target.value)}
          placeholder="What's this for?"
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
