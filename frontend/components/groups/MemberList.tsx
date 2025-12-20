import React, { useState } from 'react';
import { User } from '../../types';
import { Card, Button } from '../UIComponents';
import { Trash2, Pencil, Check, X } from 'lucide-react';

interface MemberListProps {
  members: User[];
  ownerId: string;
  currentUserId: string;
  isOwner: boolean;
  onRemoveMember: (userId: string) => void;
  onUpdateDisplayName?: (newName: string) => Promise<void>;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  ownerId,
  currentUserId,
  isOwner,
  onRemoveMember,
  onUpdateDisplayName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartEdit = (user: User) => {
    setEditingId(user.id);
    setEditValue(user.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !onUpdateDisplayName) return;
    setSaving(true);
    try {
      await onUpdateDisplayName(editValue.trim());
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('Failed to update display name:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Members ({members.length})</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {members.map(user => (
          <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt={user.name} />
              <div className="flex-1">
                {editingId === user.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      autoFocus
                      disabled={saving}
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !editValue.trim()}
                      className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    {user.name}
                    {user.username && user.username !== user.name && (
                      <span className="text-xs font-normal text-gray-500">(@{user.username})</span>
                    )}
                    {user.id === currentUserId && (
                      <>
                        <span className="text-xs font-normal text-gray-500">(You)</span>
                        {onUpdateDisplayName && (
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="Edit your display name"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    {user.id === ownerId && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Owner
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            {isOwner && user.id !== ownerId && (
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-red-500 group-hover:opacity-100 pl-2 pr-2 hover:bg-red-100 rounded-lg"
                onClick={() => onRemoveMember(user.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
