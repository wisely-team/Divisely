import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, User, Group, Expense, Split, Settlement } from '../types';
import { authService } from '../services/authService';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';
import { settlementService } from '../services/settlementService';
import { balanceService } from '../services/balanceService';

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addGroup: (name: string, description: string) => Promise<Group>;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => void;
  loadGroupExpenses: (groupId: string) => Promise<Expense[]>;
  settleUp: (payload: { groupId: string; fromUserId: string; toUserId: string; amount: number; description?: string; date?: string }) => Promise<Settlement>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  loadSettlements: (groupId: string) => Promise<Settlement[]>;
  deleteSettlement: (id: string) => Promise<void>;
  getGroupBalances: (groupId: string) => { from: string; to: string; amount: number }[];
  loadGroupBalances: (groupId: string) => Promise<{ from: string; to: string; amount: number }[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// MOCK DATA - SCENARIO FROM REQUIREMENTS
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Kevin', email: 'kevin@divisely.com', avatar: 'https://picsum.photos/id/1012/100/100' },
  { id: 'u2', name: 'Ben', email: 'ben@divisely.com', avatar: 'https://picsum.photos/id/1005/100/100' },
  { id: 'u3', name: 'Gwen', email: 'gwen@divisely.com', avatar: 'https://picsum.photos/id/1027/100/100' },
  { id: 'u4', name: 'Alice', email: 'alice@divisely.com', avatar: 'https://picsum.photos/id/1011/100/100' }
];

const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Japan Trip', description: 'Vacation 2025', ownerId: 'u1', members: ['u1', 'u2', 'u3'], currency: 'USD', created_at: '2025-10-20' },
  { id: 'g2', name: 'Korea Side Trip', description: 'One week side trip to Korea', ownerId: 'u1', members: ['u1', 'u4'], currency: 'USD', created_at: '2025-10-28' }
];

const MOCK_EXPENSES: Expense[] = [
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groupBalances, setGroupBalances] = useState<{ groupId: string; debts: { from: string; to: string; amount: number }[] }[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {

    const loadGroups = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!currentUser || !accessToken) {
        setGroups([]);
        setGroupBalances([]);
        setExpenses([]);
        return;
      }

      try {
        const apiGroups = await groupService.getGroups(accessToken);
        const normalized = apiGroups.map(g => {

          // API does not return member IDs; ensure at least the current user is present so dashboard filters work
          //const members = [currentUser.id]; // this could blow up when there are multiple members in a group !!!!!check after invite link implementation!!!!!
          // old code:
          const memberCount = Number.isFinite(g.memberCount) ? Math.max(0, g.memberCount) : 0;
          const members = memberCount > 1 ? Array(memberCount).fill(currentUser.id) : [currentUser.id];
          
          return {
            id: g.groupId,
            name: g.name,
            description: g.description,
            ownerId: currentUser.id,
            members,
            currency: 'USD',
            created_at: g.lastActivity || new Date().toISOString()
          } as Group;
        });
        setGroups(normalized);
      } catch (error) {
        console.error('Failed to fetch groups', error);
        setGroups([]);
      }
    };

    const loadGroupExpenses = async () => {
      if (!currentUser) return;

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setGroupBalances([]);
        setExpenses([]);
        return;
      }
      const allGroups = await groupService.getGroups(accessToken);

      for (const g of allGroups) {
        try {
          const apiExpenses = await expenseService.getGroupExpenses(g.groupId, accessToken);
          const normalized = apiExpenses.map((expense, index) => {
            const amount = typeof expense.amount === 'number' ? expense.amount : 0;
            const requesterShare = typeof expense.my_share === 'number' ? Math.max(0, expense.my_share) : 0;
            const splits: Split[] = requesterShare > 0 ? [{ userId: currentUser.id, amount: requesterShare }] : [];
            return {
              id: expense.expenseId || `exp_${Date.now()}_${index}`,
              groupId: g.groupId,
              payerId: expense.payerId || '',
              description: expense.description || 'Expense',
              amount,
              date: expense.paidTime || expense.createdAt || new Date().toISOString(),
              splits,
              splitType: 'CUSTOM',
              myShare: requesterShare,
              isBorrow: expense.is_borrow
            } as Expense;
          });

          setExpenses(prev => {
            const withoutGroup = prev.filter(e => e.groupId !== g.groupId);
            return [...withoutGroup, ...normalized];
          });

          // Also load balances for the group so dashboard figures are correct on first load
          try {
            const balanceResp = await balanceService.getGroupBalances(g.groupId, accessToken);
            const simplified = (balanceResp.simplifiedDebts || []).map(d => ({
              from: d.from.userId,
              to: d.to.userId,
              amount: d.amount
            }));
            setGroupBalances(prev => {
              const others = prev.filter(b => b.groupId !== g.groupId);
              return [...others, { groupId: g.groupId, debts: simplified }];
            });
          } catch (err) {
            console.error(`Failed to fetch balances for group ${g.groupId}`, err);
          }
        } catch (error) {
          console.error(`Failed to fetch expenses for group ${g.groupId}`, error);
        }
      }
    };

    loadGroups();
    loadGroupExpenses();
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const normalizedEmail = email.toLowerCase();
      const matchedUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
      const normalizedUser: User =
        matchedUser || {
          id: response.user.userId,
          name: response.user.displayName || response.user.email.split('@')[0],
          email: response.user.email
        };

      if (!matchedUser) {
        setUsers(prev => [...prev, normalizedUser]);
      }

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setCurrentUser(normalizedUser);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const addGroup = async (name: string, description: string) => {
    if (!currentUser) {
      throw new Error('Please log in to create a group.');
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Missing access token. Please log in again.');
    }

    try {
      const createdGroup = await groupService.createGroup(name, description, accessToken);
      // Normalize member IDs from the API response; support both object and string payloads
      const memberIdSet = new Set<string>();
      memberIdSet.add(currentUser.id);

      (createdGroup.members || []).forEach(m => {
        if (typeof m === 'string') {
          memberIdSet.add(m);
          return;
        }
        if (m?.userId) {
          memberIdSet.add(m.userId);
          return;
        }
        if ((m as any)?._id) {
          memberIdSet.add((m as any)._id as string);
        }
      });

      const memberIds = Array.from(memberIdSet);
      const normalizedGroup: Group = {
        id: createdGroup.groupId || `g${Date.now()}`,
        name: createdGroup.name,
        description: createdGroup.description,
        ownerId: createdGroup.createdBy || currentUser.id,
        members: memberIds.length ? memberIds : [currentUser.id],
        currency: 'USD',
        created_at: createdGroup.createdAt || new Date().toISOString()
      };
      setGroups(prev => [...prev, normalizedGroup]);
      return normalizedGroup;
    } catch (error) {
      console.error('Failed to create group', error);
      throw error;
    }
  };

  const updateGroup = async (groupId: string, data: Partial<Group>) => {
    if (!data) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('Missing access token. Skipping group update.');
      return;
    }

    try {
      const payload: { name?: string; description?: string } = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;

      await groupService.updateGroup(groupId, payload, accessToken);
      setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, ...data } : g)));
    } catch (error) {
      console.error('Failed to update group', error);
      const message = error instanceof Error ? error.message : 'update_group_failed';
      throw new Error(message);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!groupId) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('Missing access token. Skipping group deletion.');
      return;
    }

    try {
      await groupService.deleteGroup(groupId, accessToken);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to delete group on server', error);
      const message = error instanceof Error ? error.message : 'delete_group_failed';
      throw new Error(message);
    }
  };

  const removeMember = (groupId: string, userId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, members: g.members.filter(m => m !== userId) };
      }
      return g;
    }));
  };

  const loadGroupExpenses = useCallback(async (groupId: string) => {
    if (!currentUser) return [];

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('Missing access token. Skipping expense fetch.');
      return [];
    }

    try {
      const apiExpenses = await expenseService.getGroupExpenses(groupId, accessToken);
      const normalized = apiExpenses.map((expense, index) => {
        const amount = typeof expense.amount === 'number' ? expense.amount : 0;
        const requesterShare = typeof expense.my_share === 'number' ? Math.max(0, expense.my_share) : 0;
        const splits: Split[] = requesterShare > 0 ? [{ userId: currentUser.id, amount: requesterShare }] : [];

        return {
          id: expense.expenseId || `exp_${Date.now()}_${index}`,
          groupId,
          payerId: expense.payerId || '',
          description: expense.description || 'Expense',
          amount,
          date: expense.paidTime || expense.createdAt || new Date().toISOString(),
          splits,
          splitType: 'CUSTOM',
          myShare: requesterShare,
          isBorrow: expense.is_borrow
        } as Expense;
      });

      setExpenses(prev => {
        const withoutGroup = prev.filter(e => e.groupId !== groupId);
        return [...withoutGroup, ...normalized];
      });

      return normalized;
    } catch (error) {
      console.error('Failed to fetch expenses', error);
      return [];
    }
  }, [currentUser]);

  const loadSettlements = useCallback(async (groupId: string) => {
    if (!currentUser) return [];

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('Missing access token. Skipping settlements fetch.');
      return [];
    }

    try {
      const response = await settlementService.getSettlements(groupId, accessToken);
      const normalized: Settlement[] = (response.settlements || []).map(s => ({
        id: s.settlementId,
        groupId: response.groupId || groupId,
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: s.amount,
        note: s.note,
        description: s.note,
        settledAt: s.settledAt,
        createdAt: s.settledAt || s.settlementId
      }));

      setSettlements(prev => {
        const withoutGroup = prev.filter(s => s.groupId !== groupId);
        return [...withoutGroup, ...normalized];
      });

      return normalized;
    } catch (error) {
      console.error('Failed to fetch settlements', error);
      return [];
    }
  }, [currentUser]);

  const settleUp = useCallback(async (payload: { groupId: string; fromUserId: string; toUserId: string; amount: number; description?: string; date?: string }) => {
    if (!currentUser) {
      throw new Error('Please log in to settle up.');
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Missing access token. Please log in again.');
    }

    const response = await settlementService.settleUp(payload, accessToken);
    const normalized: Settlement = {
      id: response.settlementId,
      groupId: response.groupId || payload.groupId,
      fromUserId: response.fromUserId,
      toUserId: response.toUserId,
      amount: response.amount,
      note: response.note || payload.description,
      description: response.note || payload.description,
      settledAt: response.settledAt || payload.date,
      createdAt: response.settledAt || payload.date || new Date().toISOString()
    };

    setSettlements(prev => {
      const without = prev.filter(s => s.id !== normalized.id);
      return [...without, normalized];
    });

    try {
      const balanceResp = await balanceService.getGroupBalances(payload.groupId, accessToken);
      const simplified = (balanceResp.simplifiedDebts || []).map(d => ({
        from: d.from.userId,
        to: d.to.userId,
        amount: d.amount
      }));
      setGroupBalances(prev => {
        const others = prev.filter(b => b.groupId !== payload.groupId);
        return [...others, { groupId: payload.groupId, debts: simplified }];
      });
    } catch (error) {
      console.error('Failed to refresh balances after settlement', error);
    }

    return normalized;
  }, [currentUser]);

  const addExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
    if (!currentUser) {
      throw new Error('Please log in to add an expense.');
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Missing access token. Please log in again.');
    }

    try {
      const apiExpense = await expenseService.addExpense(newExpenseData, accessToken);
      const normalizedExpense: Expense = {
        id: apiExpense.expenseId || `e${Date.now()}`,
        groupId: apiExpense.groupId || newExpenseData.groupId,
        payerId: apiExpense.payerId || newExpenseData.payerId,
        description: apiExpense.description || newExpenseData.description,
        amount: typeof apiExpense.amount === 'number' ? apiExpense.amount : newExpenseData.amount,
        date: newExpenseData.date || apiExpense.createdAt || new Date().toISOString(),
        splits: (apiExpense.splits || newExpenseData.splits).map(split => ({
          userId: split.userId,
          amount: split.amount
        })),
        splitType: newExpenseData.splitType,
        myShare: newExpenseData.splits.find(s => s.userId === currentUser.id)?.amount ?? 0,
        isBorrow: (apiExpense.payerId || newExpenseData.payerId) !== currentUser.id
      };

      setExpenses(prev => [...prev, normalizedExpense]);
      return normalizedExpense;
    } catch (error) {
      console.error('Failed to add expense', error);
      const message = error instanceof Error ? error.message : 'add_expense_failed';
      throw new Error(message);
    }
  };

  const deleteExpense = useCallback(async (id: string) => {
    if (!currentUser) {
      throw new Error('Please log in to delete an expense.');
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Missing access token. Please log in again.');
    }

    try {
      await expenseService.deleteExpense(id, accessToken);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete expense', error);
      const message = error instanceof Error ? error.message : 'delete_expense_failed';
      throw new Error(message);
    }
  }, [currentUser]);

  const deleteSettlement = useCallback(async (id: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Missing access token. Please log in again.');
    }

    try {
      await settlementService.deleteSettlement(id, accessToken);
      setSettlements(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete settlement', error);
      const message = error instanceof Error ? error.message : 'delete_settlement_failed';
      throw new Error(message);
    }
  }, []);

  // System calculates simplified balances
  const getGroupBalances = (groupId: string) => {
    const entry = groupBalances.find(b => b.groupId === groupId);
    return entry ? entry.debts : [];
  };

  const loadGroupBalances = useCallback(async (groupId: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return [];
    try {
      const response = await balanceService.getGroupBalances(groupId, accessToken);
      const simplified = (response.simplifiedDebts || []).map(d => ({
        from: d.from.userId,
        to: d.to.userId,
        amount: d.amount
      }));
      setGroupBalances(prev => {
        const others = prev.filter(b => b.groupId !== groupId);
        return [...others, { groupId, debts: simplified }];
      });
      return simplified;
    } catch (error) {
      console.error('Failed to fetch balances', error);
      return [];
    }
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, users, groups, expenses, settlements, login, logout, addGroup, updateGroup, deleteGroup, removeMember, loadGroupExpenses, settleUp, addExpense, deleteExpense, getGroupBalances, loadSettlements, deleteSettlement, loadGroupBalances }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
