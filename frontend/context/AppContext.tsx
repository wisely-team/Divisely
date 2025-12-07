import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, User, Group, Expense, Split } from '../types';
import { authService } from '../services/authService';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addGroup: (name: string, description: string) => Promise<Group>;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
  loadGroupExpenses: (groupId: string) => Promise<Expense[]>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  getGroupBalances: (groupId: string) => { from: string; to: string; amount: number }[];
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
  {
    id: 'e1',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Flights',
    amount: 3000,
    date: '2025-10-21',
    splitType: 'EQUAL',
    splits: [
      { userId: 'u1', amount: 1000 },
      { userId: 'u2', amount: 1000 },
      { userId: 'u3', amount: 1000 }
    ]
  },
  {
    id: 'e2',
    groupId: 'g1',
    payerId: 'u2',
    description: 'Hotel Rooms',
    amount: 1500,
    date: '2025-10-22',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 450 }, // Ben
      { userId: 'u1', amount: 450 }, // Kevin
      { userId: 'u3', amount: 600 }  // Gwen
    ]
  },
  {
    id: 'e3',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Meals',
    amount: 900,
    date: '2025-10-26',
    splitType: 'EQUAL',
    splits: [
      { userId: 'u2', amount: 300 }, // Ben
      { userId: 'u1', amount: 300 }, // Kevin
      { userId: 'u3', amount: 300 }  // Gwen
    ]
  },
  {
    id: 'e4',
    groupId: 'g1',
    payerId: 'u2',
    description: 'City Tour',
    amount: 600,
    date: '2025-11-05',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 175 }, // Ben
      { userId: 'u1', amount: 175 }, // Kevin
      { userId: 'u3', amount: 250 }  // Gwen
    ]
  },
  {
    id: 'e5',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Souvenirs',
    amount: 120,
    date: '2025-11-10',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 45 }, // Ben
      { userId: 'u1', amount: 45 }, // Kevin
      { userId: 'u3', amount: 30 }  // Gwen
    ]
  },
  {
    id: 'e6',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Local Transport',
    amount: 150,
    date: '2025-11-18',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 50 }, // Ben
      { userId: 'u1', amount: 50 }, // Kevin
      { userId: 'u3', amount: 50 }  // Gwen
    ]
  },
  {
    id: 'e7',
    groupId: 'g1',
    payerId: 'u2',
    description: 'Karaoke Night',
    amount: 200,
    date: '2025-11-25',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 50 }, // Ben
      { userId: 'u1', amount: 50 }, // Kevin
      { userId: 'u3', amount: 100 }  // Gwen
    ]
  },
  {
    id: 'e8',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Museum Visit',
    amount: 90,
    date: '2025-12-01',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 30 }, // Ben
      { userId: 'u1', amount: 30 }, // Kevin
      { userId: 'u3', amount: 30 }  // Gwen
    ]
  },
  {
    id: 'e9',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Zipline Adventure',
    amount: 400,
    date: '2025-12-11',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 100 }, // Ben
      { userId: 'u1', amount: 100 }, // Kevin
      { userId: 'u3', amount: 200 }  // Gwen
    ]
  },
  {
    id: 'e10',
    groupId: 'g1',
    payerId: 'u2',
    description: 'Theme Park',
    amount: 600,
    date: '2025-12-18',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 200 }, // Ben
      { userId: 'u1', amount: 200 }, // Kevin
      { userId: 'u3', amount: 200 }  // Gwen
    ]
  },
  {
    id: 'e11',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Xmas Gifts',
    amount: 1500,
    date: '2025-12-22',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 500 }, // Ben
      { userId: 'u1', amount: 500 }, // Kevin
      { userId: 'u3', amount: 500 }  // Gwen
    ]
  },
  {
    id: 'e12',
    groupId: 'g1',
    payerId: 'u1',
    description: 'New Year Dinner',
    amount: 300,
    date: '2025-12-25',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 100 }, // Ben
      { userId: 'u1', amount: 100 }, // Kevin
      { userId: 'u3', amount: 100 }  // Gwen
    ]
  },
  {
    id: 'e13',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Ski Equipment Rental',
    amount: 600,
    date: '2025-12-28',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 200 }, // Ben
      { userId: 'u1', amount: 200 }, // Kevin
      { userId: 'u3', amount: 200 }  // Gwen
    ]
  },
  {
    id: 'e14',
    groupId: 'g1',
    payerId: 'u2',
    description: 'Taxi Rides',
    amount: 90,
    date: '2026-01-02',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 30 }, // Ben
      { userId: 'u1', amount: 30 }, // Kevin
      { userId: 'u3', amount: 30 }  // Gwen
    ]
  },
  {
    id: 'e15',
    groupId: 'g1',
    payerId: 'u2',
    description: 'Plane Tickets Home',
    amount: 1500,
    date: '2026-01-14',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 500 }, // Ben
      { userId: 'u1', amount: 500 }, // Kevin
      { userId: 'u3', amount: 500 }  // Gwen
    ]
  },
  {
    id: 'e16',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Airport Meals',
    amount: 90,
    date: '2026-02-01',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 30 }, // Ben
      { userId: 'u1', amount: 30 }, // Kevin
      { userId: 'u3', amount: 30 }  // Gwen
    ]
  },
  {
    id: 'e17',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Taxi Rides',
    amount: 130,
    date: '2026-02-02',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 45 }, // Ben
      { userId: 'u1', amount: 25 }, // Kevin
      { userId: 'u3', amount: 60 }  // Gwen
    ]
  },
  {
    id: 'e18',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Travel Insurance',
    amount: 600,
    date: '2026-02-17',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 200 }, // Ben
      { userId: 'u1', amount: 200 }, // Kevin
      { userId: 'u3', amount: 200 }  // Gwen
    ]
  },
  {
    id: 'e19',
    groupId: 'g1',
    payerId: 'u3',
    description: 'Match Tickets',
    amount: 600,
    date: '2026-03-01',
    splitType: 'EQUAL', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 200 }, // Ben
      { userId: 'u1', amount: 200 }, // Kevin
      { userId: 'u3', amount: 200 }  // Gwen
    ]
  },
  {
    id: 'e20',
    groupId: 'g2',
    payerId: 'u4',
    description: 'Hotel Stay',
    amount: 600,
    date: '2025-10-29',
    splitType: 'EQUAL',
    splits: [
      { userId: 'u1', amount: 300 },
      { userId: 'u4', amount: 300 }
    ]
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);

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
        return;
      }

      try {
        const apiGroups = await groupService.getGroups(accessToken);
        const normalized = apiGroups.map(g => {
          const memberCount = Number.isFinite(g.memberCount) ? Math.max(0, g.memberCount) : 0;
          const members = Array.from({ length: memberCount }, (_, idx) => `member_${idx}`);
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

    loadGroups();
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
      const memberIds = (createdGroup.members || []).map(m => m.userId).filter(Boolean);
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

  const updateGroup = (groupId: string, data: Partial<Group>) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, ...data } : g));
  };

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    // Optionally clean up expenses
    setExpenses(expenses.filter(e => e.groupId !== groupId));
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

  // System calculates simplified balances
  const getGroupBalances = (groupId: string) => {
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    const balances: { [key: string]: number } = {};

    // Initialize 0 for all members
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.members.forEach(m => balances[m] = 0);
    }

    groupExpenses.forEach(expense => {
      const payer = expense.payerId;
      const amount = expense.amount;
      
      // Payer gets positive balance (they paid)
      balances[payer] = (balances[payer] || 0) + amount;

      // Subtract split amounts from beneficiaries
      expense.splits.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });

    // Simplify debts
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, amount]) => {
      // Fix floating point issues
      const cleanAmount = Math.round(amount * 100) / 100;
      if (cleanAmount < -0.01) debtors.push({ id: userId, amount: cleanAmount }); // Negative means they owe
      if (cleanAmount > 0.01) creditors.push({ id: userId, amount: cleanAmount }); // Positive means they are owed
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const result = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const debt = Math.abs(debtor.amount);
      const credit = creditor.amount;
      
      const amountToSettle = Math.min(debt, credit);
      
      result.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amountToSettle * 100) / 100
      });

      debtors[i].amount += amountToSettle;
      creditors[j].amount -= amountToSettle;

      if (Math.abs(debtors[i].amount) < 0.01) i++;
      if (Math.abs(creditors[j].amount) < 0.01) j++;
    }

    return result;
  };

  return (
    <AppContext.Provider value={{ currentUser, users, groups, expenses, login, logout, addGroup, updateGroup, deleteGroup, removeMember, loadGroupExpenses, addExpense, deleteExpense, getGroupBalances }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
