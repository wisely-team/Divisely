export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // ID of the user who owns/created the group
  members: string[]; // Array of User IDs
  currency: string;
  created_at: string;
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  payerId: string;
  description: string;
  amount: number;
  date: string;
  splits: Split[];
  splitType: 'EQUAL' | 'CUSTOM';
}

export interface Balance {
  from: string; // User ID who owes
  to: string;   // User ID who is owed
  amount: number;
}

// For sidebar quick group list
export interface GroupSummary {
  id: string;
  name: string;
  unreadCount?: number; // Number of new expenses/activities
  lastActivity?: string;
}

// For sidebar balance widget
export interface UserBalance {
  totalOwed: number; // Total amount others owe to you
  totalDebt: number; // Total amount you owe to others
  netBalance: number; // totalOwed - totalDebt
}

// For the UI context
export interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  expenses: Expense[];
}