import React, { useState, useMemo } from 'react';
import { Users, ChevronRight, ArrowLeft, Search, Plus } from 'lucide-react';
import { Modal } from '../UIComponents';
import { AddExpenseModal } from './AddExpenseModal';
import { useApp } from '../../context/AppContext';
import type { Group, User } from '../../types';

interface GlobalAddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalAddExpenseModal: React.FC<GlobalAddExpenseModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { groups, currentUser, users, addExpense } = useApp();
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter groups based on search
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groups || [];
        const query = searchQuery.toLowerCase();
        return (groups || []).filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.description?.toLowerCase().includes(query)
        );
    }, [groups, searchQuery]);

    // Get users for selected group
    const groupUsers: User[] = useMemo(() => {
        if (!selectedGroup) return [];
        return (users || []).filter(u => selectedGroup.members.includes(u.id));
    }, [selectedGroup, users]);

    const handleClose = () => {
        setSelectedGroup(null);
        setSearchQuery('');
        onClose();
    };

    const handleBack = () => {
        setSelectedGroup(null);
        setSearchQuery('');
    };

    const handleAddExpense = async (expense: Parameters<typeof addExpense>[0]) => {
        await addExpense(expense);
    };

    // If a group is selected, show the AddExpenseModal
    if (selectedGroup) {
        return (
            <AddExpenseModal
                isOpen={isOpen}
                onClose={handleClose}
                groupUsers={groupUsers}
                currentUserId={currentUser?.id || ''}
                onAddExpense={handleAddExpense}
                groupId={selectedGroup.id}
            />
        );
    }

    // Otherwise, show the group selection step
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="" className="max-w-lg p-0">
            <div className="flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="bg-white px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-lg shadow-teal-500/20">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
                            <p className="text-gray-500 text-sm">Select a group to add an expense</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Group List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-1">
                                {searchQuery ? 'No groups found' : 'No groups yet'}
                            </h3>
                            <p className="text-gray-500 text-sm max-w-xs">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Create a group first to start adding expenses'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredGroups.map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className="w-full flex items-center gap-4 p-4 bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-xl transition-all group text-left"
                                >
                                    <div className="bg-gradient-to-br from-teal-100 to-teal-50 p-3 rounded-lg group-hover:from-teal-200 group-hover:to-teal-100 transition-colors">
                                        <Users className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                            {group.description && ` · ${group.description}`}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center">
                        Tip: You can also add expenses from within a group's page
                    </p>
                </div>
            </div>
        </Modal>
    );
};
