# API Contract - Frontend & Backend Agreement

Bu dosya Frontend ve Backend ekipleri arasındaki API sözleşmesini tanımlar.

## Base URL
```
Development: http://localhost:8080/api
Production: TBD
```

## Authentication

### 1. Register (Kayıt)
```http
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "Ali Veli"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "displayName": "Ali Veli",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Login (Giriş)
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "userId": "user_123",
      "email": "user@example.com",
      "displayName": "Ali Veli"
    }
  }
}
```

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Groups

### 1. Create Group
```http
POST /api/groups
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "name": "Tatil Grubu",
  "description": "Antalya tatili için harcamalar",
}

Response (201 Created):
{
  "success": true,
  "data": {
    "groupId": "group_55",
    "name": "Tatil Grubu",
    "description": "Antalya tatili için harcamalar",
    "createdBy": "user_123",
    "members": [
      {
        "userId": "user_123",
        "displayName": "Ali Veli",
        "email": "ali@example.com"
      }    
    ],
    "memberBalances": [
      {
        "id": "user_123",
        "balance": 0
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get User's Groups
```http
GET /api/groups
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "groupId": "group_55",
      "name": "Tatil Grubu",
      "description": "Antalya tatili için harcamalar",
      "memberCount": 3,
      "totalExpenses": 15000.00,
      "yourBalance": -450.00,
      "lastActivity": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Get Group Details
```http
GET /api/groups/{groupId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "data": {
    "groupId": "group_55",
    "name": "Tatil Grubu",
    "description": "Antalya tatili için harcamalar",
    "createdBy": "user_123",
    "members": [
      {
        "userId": "user_123",
        "displayName": "Ali Veli",
        "email": "ali@example.com",
      },
      {
        "userId": "user_456",
        "displayName": "Ayşe Yılmaz",
        "email": "ayse@example.com",
      }
    ],
    "memberBalances": [
      {
        "id": "user_123",
        "balance": 0
      },
      {
        "id": "user_456",
        "balance": 0
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Expenses
```
POST /api/add_expense
Authorization: Bearer {accessToken}
Content-Type: application/json


Request (Custom Split):
{
  "groupId": "group_55",
  "description": "Akşam Yemeği",
  "amount": 1500.00,
  "payerId": "user_123",
"paid at": "2023-01-15T10:30:00Z"
  "splits": [
    { "userId": "user_123", "amount": 450.00 },
    { "userId": "user_456", "amount": 600.00 },
    { "userId": "user_789", "amount": 450.00 }
  ]
}

Response (201 Created):
{
  "success": true,
  "data": {
    "expenseId": "exp_999",
    "groupId": "group_55",
    "description": "Akşam Yemeği",
    "amount": 1500.00,
    "payerId": "user_123",
    "payerName": "Ali Veli",
    "splits": [
      {
        "userId": "user_123",
        "displayName": "Ali Veli",
        "amount": 450.00,
      },
      {
        "userId": "user_456",
        "displayName": "Ayşe Yılmaz",
        "amount": 600.00,
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get Group Expenses
```http
GET /api/get_expenses/{groupId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "expenseId": "exp_999",
      "description": "Akşam Yemeği",
      "amount": 1500.00,
      "payerId": "user_123",
      "payerName": "Ali Veli",
      "my_share": 500,
      "is_borrow": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "paidTime": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Delete Expense
```http
DELETE /api/expenses/{expenseId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

## Balances (Kim Kime Borçlu?)

### 1. Get Group Balances (Simplified - FR-15)
```http
GET /api/groups/{groupId}/balances
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "success": true,
  "data": {
    "groupId": "group_55",
    "simplifiedDebts": [
      {
        "from": {
          "userId": "user_456",
          "displayName": "Ayşe Yılmaz"
        },
        "to": {
          "userId": "user_123",
          "displayName": "Ali Veli"
        },
        "amount": 500.00
      },
      {
        "from": {
          "userId": "user_789",
          "displayName": "Mehmet Can"
        },
        "to": {
          "userId": "user_123",
          "displayName": "Ali Veli"
        },
        "amount": 300.00
      }
    ],
    "memberBalances": [
      {
        "userId": "user_123",
        "displayName": "Ali Veli",
        "balance": 800.00
      },
      {
        "userId": "user_456",
        "displayName": "Ayşe Yılmaz",
        "balance": -500.00
      },
      {
        "userId": "user_789",
        "displayName": "Mehmet Can",
        "balance": -300.00
      }
    ]
  }
}
```

### 2. Settle Up (Borç Öde)
```http
POST /api/settlements
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "groupId": "group_55",
  "fromUserId": "user_456",
  "toUserId": "user_123",
  "amount": 500.00,
  "note": "Akşam yemeği borcu"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "settlementId": "settle_111",
    "groupId": "group_55",
    "fromUserId": "user_456",
    "toUserId": "user_123",
    "amount": 500.00,
    "note": "Akşam yemeği borcu",
    "settledAt": "2024-01-15T11:00:00Z"
  }
}
```

## Error Responses

Tüm endpoint'ler hata durumunda şu formatta dönüş yapacak:

```http
Response (400/401/403/404/500):
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: amount",
    "details": {
      "field": "amount",
      "reason": "Amount must be greater than 0"
    }
  }
}
```

### Common Error Codes
- `INVALID_REQUEST`: Geçersiz istek
- `UNAUTHORIZED`: Token eksik veya geçersiz
- `FORBIDDEN`: Yetkisiz erişim
- `NOT_FOUND`: Kaynak bulunamadı
- `CONFLICT`: Çakışma (örn: email zaten kayıtlı)
- `INTERNAL_ERROR`: Sunucu hatası

## Notes for Backend Team

1. **Token Format**: JWT kullanılacak, `expiresIn` 1 saat (3600 saniye)
2. **Date Format**: ISO 8601 format (`2024-01-15T10:30:00Z`)
3. **Currency**: Tüm tutarlar TL cinsinden, 2 ondalık basamak
4. **Pagination**: Gerektiğinde `?page=1&limit=20` parametreleri eklenebilir
5. **CORS**: Frontend için `http://localhost:5173` allowed origin olmalı
6. **Rate Limiting**: Dakikada maksimum 60 istek (önerilir)

## Frontend Usage Example

```typescript
// Frontend'de kullanım örneği
const response = await fetch('http://localhost:8080/api/expenses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    groupId: 'group_55',
    description: 'Akşam Yemeği',
    amount: 1500.00,
    payerId: 'user_123',
    splitType: 'EQUAL'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Expense created:', data.data);
}
```
