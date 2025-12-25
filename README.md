# Divisely

Divisely is a modern web application for managing shared expenses and group payments — a Splitwise-inspired platform built with **React**, **Node.js/Express**, and **MongoDB**.

## ✨ Features

- **Group Management** - Create and manage expense groups with friends and family
- **Expense Tracking** - Add, edit, and split expenses with multiple split options
- **Balance Calculation** - Automatic calculation of who owes whom
- **User Authentication** - Secure JWT-based authentication with refresh tokens
- **Password Recovery** - Email-based password reset via Brevo
- **AI Assistant** - Google Gemini-powered expense suggestions and insights
- **Activity Feed** - Real-time activity tracking for all groups
- **User Profiles** - Customizable user profiles and settings
- **Responsive Design** - Beautiful UI that works on all devices

## 🧩 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** with Express 5
- **MongoDB** with Mongoose ODM
- **JWT** - Authentication & authorization
- **Brevo** - Transactional emails
- **Google Gemini** - AI-powered features

### Deployment
- **Frontend**: Netlify
- **Backend**: Google Cloud Run

## � Project Structure

```
Divisely/
├── frontend/           # React + Vite frontend
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── context/        # React context providers
│   └── utils/          # Utility functions
│
├── backend/
│   └── api/            # Express API server
│       ├── controllers/  # Route handlers
│       ├── models/       # Mongoose schemas
│       ├── routes/       # API routes
│       ├── middleware/   # Custom middleware
│       └── config/       # Configuration files
│
└── netlify.toml        # Netlify deployment config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Brevo account (for emails)
- Google AI Studio API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wisely-team/Divisely.git
   cd Divisely
   ```

2. **Set up the backend**
   ```bash
   cd backend/api
   npm install
   
   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

### Configuration

Edit `backend/api/.env` with your credentials:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/divisely

# JWT secrets (generate secure random strings)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Brevo email API key
BREVO_API_KEY=xkeysib-xxxxx

# Google Gemini API key
GEMINI_API_KEY=AIza-xxxxx

# CORS origins
FRONTEND_ORIGIN=http://localhost:5173
```

### Running Locally

**Start the backend:**
```bash
cd backend/api
npm run dev
```

**Start the frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

### Database Seeding

To seed the database with test data:
```bash
cd backend/api
npm run db:reset
```

## 📚 Documentation

- [Frontend Architecture](frontend/ARCHITECTURE.md)
- [Frontend Setup Guide](frontend/SETUP.md)
- [API Contract](backend/API_CONTRACT.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
