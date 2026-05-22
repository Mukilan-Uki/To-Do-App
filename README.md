# Do(es) - Modern MERN To-Do Web Application

Do(es) is a colorful, cute, and modern full-stack MERN (MongoDB, Express, React, Node.js) to-do application designed for high productivity. It features dual interfaces: a beautiful User Dashboard for managing personal tasks and a premium SaaS-style Admin Dashboard for monitoring platform analytics and users.

## Features

- **User Dashboard**:
  - Full CRUD for tasks (Create, Read, Update, Delete)
  - Drag-and-drop to reorder tasks (`dnd-kit`)
  - Cute, colorful UI with Framer Motion animations
  - Dark/Light mode toggle
  - Responsive design (Tailwind CSS)
  - Productivity stats (Completed, Pending)
- **Admin Dashboard**:
  - Secure Role-based access control (JWT)
  - Visually distinct dark futuristic SaaS UI
  - Real-time charts for User Growth (`recharts`)
  - Platform-wide statistics
  - User management (Delete users and their tasks)
- **Security & Setup**:
  - JWT Authentication
  - Password Hashing (`bcrypt`)
  - Ready for deployment on Render (Backend) and Vercel (Frontend)

## Project Structure

- `/client` - React frontend (Vite)
- `/server` - Node.js / Express backend

## Environment Variables Setup

### Server (`/server/.env`)
Create a `.env` file in the `/server` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/does_app
JWT_SECRET=supersecretjwtkey_12345
APP_NAME=Do(es)
FRONTEND_URL=http://localhost:5173
```

### Client (`/client/.env`)
Create a `.env` file in the `/client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
*(Note: To easily change the app name, edit `src/config/constants.js`)*

## Installation & Running

### 1. Backend (Server)
```bash
cd server
npm install
npm run dev
```

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
```

## Demo Credentials
To access the Admin Dashboard, register a normal user account and manually change the role to `admin` in your MongoDB database, or use an existing seeded admin account.

## Tech Stack
- MongoDB & Mongoose
- Express.js
- React.js (Vite)
- Node.js
- Tailwind CSS v3
- Framer Motion
- dnd-kit
- Recharts
