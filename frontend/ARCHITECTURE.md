# Frontend Mimari Kılavuzu

## Klasör Yapısı

```
frontend/
├── components/
│   ├── ui/              # Yeniden kullanılabilir UI bileşenleri (Lego parçaları)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── auth/            # Kimlik doğrulama bileşenleri
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── expenses/        # Harcama ile ilgili bileşenler
│   │   ├── ExpenseCard.tsx
│   │   ├── AddExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   └── SplitTypeSelector.tsx
│   ├── groups/          # Grup yönetimi bileşenleri
│   │   ├── GroupCard.tsx
│   │   ├── CreateGroupForm.tsx
│   │   ├── GroupMemberList.tsx
│   │   └── AddMemberModal.tsx
│   └── UIComponents.tsx # Mevcut (taşınacak)
├── pages/               # Sayfalar (Her sayfa bir route)
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── GroupDetail.tsx
│   └── NotFound.tsx
├── services/            # API istekleri
│   ├── api.ts           # Temel API yapılandırması
│   ├── authService.ts
│   ├── groupService.ts
│   ├── expenseService.ts
│   └── geminiService.ts # Mevcut
├── context/             # Global durum yönetimi
│   ├── AuthContext.tsx
│   ├── GroupContext.tsx
│   └── AppContext.tsx   # Mevcut
├── hooks/               # Özel React hook'ları
│   ├── useAuth.ts
│   ├── useGroups.ts
│   ├── useExpenses.ts
│   └── useBalances.ts
├── utils/               # Yardımcı fonksiyonlar
│   ├── formatCurrency.ts
│   ├── formatDate.ts
│   ├── validateEmail.ts
│   └── calculateSplit.ts
├── types.ts             # TypeScript tipleri (global)
├── App.tsx              # Ana uygulama bileşeni
├── index.tsx            # Giriş noktası
└── index.css            # Global stiller
```

## Görev Dağılımı (Conflict Önleme)

### Hakan
- `services/` klasörü (API entegrasyonu)
- `context/` klasörü (State management)
- `hooks/` klasörü
- `utils/` klasörü

### Kerem
- `pages/` klasörü (Routing & pages)
- `components/auth/`
- `components/groups/`

### Metin
- `components/ui/` klasörü (Design system)
- `components/expenses/`
- CSS/Styling

**Kural:** Herkes kendi klasöründe çalışır. Başka birine ait dosyada değişiklik yapacaksanız önce haber verin.

## 1. Korumalı Rotalar (Protected Routes)

### components/auth/ProtectedRoute.tsx
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### App.tsx (Yönlendirme)
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:groupId"
          element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 2. Kimlik Doğrulama Context & Servisi

### context/AuthContext.tsx
```typescript
import { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (token exists)
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Optionally: verify token with backend
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    await authService.register(email, password, displayName);
    // Auto login after register
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### hooks/useAuth.ts
```typescript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### services/authService.ts
```typescript
import api from './api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    displayName: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  async register(email: string, password: string, displayName: string) {
    const response = await api.post('/auth/register', {
      email,
      password,
      displayName
    });
    return response.data.data;
  },

  async logout() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await api.post('/auth/logout');
    }
  }
};
```

### services/api.ts (Temel Yapılandırma)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default new ApiClient(API_BASE_URL);
```

## 3. Gösterge Paneli & Bakiyeler (FR-15, FR-16)

### pages/Dashboard.tsx
```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import GroupCard from '../components/groups/GroupCard';
import type { Group } from '../types';

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await groupService.getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Groups</h1>
      <div className="groups-grid">
        {groups.map(group => (
          <GroupCard
            key={group.groupId}
            group={group}
            onClick={() => navigate(`/groups/${group.groupId}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

### pages/GroupDetail.tsx (FR-15 - Kim Kime Ne Kadar Borçlu?)
```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';
import DebtCard from '../components/expenses/DebtCard';
import ExpenseList from '../components/expenses/ExpenseList';
import type { SimplifiedDebt, Expense } from '../types';

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [balances, setBalances] = useState<SimplifiedDebt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    if (!groupId) return;

    const [balanceData, expenseData] = await Promise.all([
      groupService.getGroupBalances(groupId),
      expenseService.getGroupExpenses(groupId)
    ]);

    setBalances(balanceData.simplifiedDebts);
    setExpenses(expenseData);
  };

  return (
    <div>
      <section>
        <h2>Who Owes Whom?</h2>
        {balances.length === 0 ? (
          <p>All settled up! 🎉</p>
        ) : (
          <div className="debts-list">
            {balances.map((debt, index) => (
              <DebtCard key={index} debt={debt} onSettle={loadData} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Expenses</h2>
        <ExpenseList expenses={expenses} />
      </section>
    </div>
  );
}
```

### components/expenses/DebtCard.tsx
```typescript
import { useState } from 'react';
import { expenseService } from '../../services/expenseService';
import { formatCurrency } from '../../utils/formatCurrency';
import type { SimplifiedDebt } from '../../types';

interface DebtCardProps {
  debt: SimplifiedDebt;
  onSettle: () => void;
}

export default function DebtCard({ debt, onSettle }: DebtCardProps) {
  const [settling, setSettling] = useState(false);

  const handleSettle = async () => {
    setSettling(true);
    try {
      await expenseService.settleUp(
        debt.groupId,
        debt.from.userId,
        debt.to.userId,
        debt.amount
      );
      onSettle(); // Refresh data
    } catch (error) {
      console.error('Failed to settle:', error);
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="debt-card">
      <div className="debt-card__from">{debt.from.displayName}</div>
      <div className="debt-card__arrow">→</div>
      <div className="debt-card__to">{debt.to.displayName}</div>
      <div className="debt-card__amount">{formatCurrency(debt.amount)}</div>
      <button
        onClick={handleSettle}
        disabled={settling}
        className="debt-card__settle-btn"
      >
        {settling ? 'Settling...' : 'Settle Up'}
      </button>
    </div>
  );
}
```

## 4. Tipler (types.ts)

```typescript
export interface User {
  userId: string;
  email: string;
  displayName: string;
}

export interface Group {
  groupId: string;
  name: string;
  description?: string;
  memberCount: number;
  totalExpenses: number;
  yourBalance: number;
  lastActivity: string;
}

export interface Expense {
  expenseId: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  payerName: string;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  category?: string;
  createdAt: string;
}

export interface SimplifiedDebt {
  groupId: string;
  from: {
    userId: string;
    displayName: string;
  };
  to: {
    userId: string;
    displayName: string;
  };
  amount: number;
}
```

## 5. Yardımcı Fonksiyonlar

### utils/formatCurrency.ts
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}
```

### utils/formatDate.ts
```typescript
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

### utils/validateEmail.ts
```typescript
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
```

## 6. Ortam Değişkenleri (.env.local)

```env
VITE_API_URL=http://localhost:8080/api
```

## Geliştirme İş Akışı

### 1. Başlamadan Önce
```bash
git pull origin main
npm install
```

### 2. Yeni Özellik Geliştirme
```bash
# Kendi branch'inizi oluşturun
git checkout -b feature/expense-form

# Kod yazın...

# Commit
git add .
git commit -m "Add expense form component"

# Push
git push origin feature/expense-form
```

### 3. Merge Conflict Önleme
- Kendi klasörünüzde çalışın
- Başkasının dosyasını değiştirmeden önce haber verin
- Sık sık `git pull` yapın

## En İyi Uygulamalar

1. **Bileşen İsimlendirme**: PascalCase (örn: `ExpenseCard.tsx`)
2. **Fonksiyon İsimlendirme**: camelCase (örn: `formatCurrency`)
3. **Sabit İsimlendirme**: UPPER_SNAKE_CASE (örn: `API_BASE_URL`)
4. **Props Interface**: BileşenAdı + Props (örn: `DebtCardProps`)
5. **Her zaman TypeScript tiplerini kullanın** - `any` kullanmayın
6. **Hata Yönetimi**: Her API çağrısında try-catch kullanın
7. **Yükleme Durumları**: API çağrıları sırasında loading gösterin
8. **Kullanıcı Geri Bildirimi**: Başarı/Hata mesajları gösterin

## Test

```bash
# Testleri çalıştır
npm test

# İzleme modunda çalıştır
npm run test:watch

# Kapsam raporu
npm run test:coverage
```

## API Sözleşmesi

Tüm API endpoint'leri için `/frontend/API_CONTRACT.md` dosyasını inceleyin.
Backend ekibi bu sözleşmeye göre API yazacak.
