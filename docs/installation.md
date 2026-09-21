# Installation & Setup Guide

## System Requirements
- Node.js 18.0.0 or higher
- MongoDB 6.0+ (local instance or MongoDB Atlas cluster)
- npm 9.0.0+

## Local Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd AquaSentinel
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure Environment Variables (`backend/.env`):**
   Ensure `MONGODB_URI` and `JWT_SECRET` are correctly configured.

4. **Seed Initial Admin Account (Optional):**
   ```bash
   npm run seed
   ```
   This creates an admin account: `admin@aquasentinel.com` / `admin123`.

5. **Start Backend Server & Simulator:**
   ```bash
   npm run dev
   ```

6. **Frontend Setup (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Access Application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.
