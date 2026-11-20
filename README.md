# IMovies — Movie Ticket Booking Platform

> **Tagline:** Movie ticket booking made simple.

IMovies is a production-quality full-stack MERN application for discovering movies, browsing theatres, selecting showtimes, viewing interactive real-time seat layouts, booking tickets, and administrative management.

Engineered specifically for single-project deployment on **Vercel** with serverless functions and **MongoDB Atlas**.

---

## 🏗️ Architecture Overview

- **Frontend:** React.js, Vite, React Router DOM, Axios, Context API, CSS3.
- **Backend:** Node.js, Express.js, Serverless Functions (`server/index.js`), JWT, bcryptjs.
- **Database:** MongoDB Atlas (Mongoose ODM) with warm connection pooling and compound unique indexing for seats.
- **Hosting:** Vercel (Static frontend + Serverless backend in one repository).

---

## 📁 Project Structure

```text
imovies/
├── client/               # React + Vite frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── services/     # Axios API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/               # Express backend application
│   ├── config/           # MongoDB Atlas connection manager (warm cache)
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Security headers, rate limiting & auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # REST API routes
│   ├── services/         # IMDB service
│   ├── app.js            # Express app configuration (no app.listen)
│   ├── index.js          # Vercel Serverless Function entry point
│   └── server.js         # Local development server entry point
├── package.json          # Root package scripts & backend dependencies
├── vercel.json           # Vercel routing & rewrite configuration
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Install backend and root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment
Create `.env` in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers
```bash
# Runs both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

