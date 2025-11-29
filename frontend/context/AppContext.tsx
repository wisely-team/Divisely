import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Group, Expense, Split } from '../types';

interface AppContextType extends AppState {
  login: (email: string) => void;
  logout: () => void;
  addGroup: (name: string, description: string) => void;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  getGroupBalances: (groupId: string) => { from: string; to: string; amount: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// MOCK DATA - SCENARIO FROM REQUIREMENTS
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Kevin', email: 'kevin@divisely.com', avatar: 'https://picsum.photos/id/1012/100/100' },
  { id: 'u2', name: 'Ben', email: 'ben@divisely.com', avatar: 'https://picsum.photos/id/1005/100/100' },
  { id: 'u3', name: 'Gwen', email: 'gwen@divisely.com', avatar: 'https://picsum.photos/id/1027/100/100' },
];

const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Japan Trip', description: 'Vacation 2025', ownerId: 'u1', members: ['u1', 'u2', 'u3'], currency: 'USD', created_at: '2025-10-20' }
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    groupId: 'g1',
    payerId: 'u1',
    description: 'Flights',
    amount: 3000,
    date: '2025-10-21',
    category: 'Transport',
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
    category: 'Accommodation',
    splitType: 'CUSTOM', // Scenario 6: Gwen edited this
    splits: [
      { userId: 'u2', amount: 450 }, // Ben
      { userId: 'u1', amount: 450 }, // Kevin
      { userId: 'u3', amount: 600 }  // Gwen
    ]
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(MOCK_USERS);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);

  const login = (email: string) => {
    // Simple mock login
    const user = users.find(u => u.email === email);
    if (user) setCurrentUser(user);
    else alert("User not found (Try kevin@divisely.com)");
  };

  const logout = () => setCurrentUser(null);

  const addGroup = (name: string, description: string) => {
    if (!currentUser) return;
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name,
      description,
      ownerId: currentUser.id,
      members: [currentUser.id],
      currency: 'USD',
      created_at: new Date().toISOString()
    };
    setGroups([...groups, newGroup]);
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

  const addExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: `e${Date.now()}`
    };
    setExpenses([...expenses, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Requirement FR-15: System calculates simplified balances
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
    <AppContext.Provider value={{ currentUser, users, groups, expenses, login, logout, addGroup, updateGroup, deleteGroup, removeMember, addExpense, deleteExpense, getGroupBalances }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};