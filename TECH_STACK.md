# AquaSentinel — Tech Stack Documentation

This document provides a comprehensive overview of the technology stack, libraries, architecture, and deployment setup used in **AquaSentinel** (HydroDetect FSD) — an AI-assisted IoT industrial wastewater compliance and monitoring platform.

---

## 📐 Architecture Overview

AquaSentinel follows a modern decoupled MERN architecture extended with real-time WebSocket communication and IoT hardware ingestion capabilites:

```
[ ESP32 Hardware / Simulator ]
               │
               ▼ (USB Serial / Telemetry API)
      [ Express Backend ]
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
[MongoDB] [Socket.IO] [Nodemailer]
               │
               ▼ (WebSocket & REST API)
     [ React Frontend Dashboard ]
```

---

## 🎨 Frontend Stack

| Category | Technology / Library | Version | Description |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^19.2.7` | UI component library utilizing functional components and hooks |
| **Build Tool & Dev Server**| Vite | `^8.1.1` | Next-generation fast frontend bundler and dev server |
| **Styling & CSS** | Tailwind CSS | `^4.3.3` | Utility-first CSS framework with `@tailwindcss/vite` plugin |
| **Animations** | Framer Motion | `^12.42.2` | Production-ready motion and animation engine |
| **Icons** | React Icons | `^5.7.0` | Comprehensive icon library (Lucide, Feather, FontAwesome, etc.) |
| **Routing** | React Router DOM | `^7.18.1` | Client-side declarative routing |
| **Charts & Data Viz** | Recharts | `^3.10.1` | Dynamic chart rendering for pH, TDS, and flow rate metrics |
| **Mapping & GIS** | Leaflet / React Leaflet | `^1.9.4` / `^5.0.0` | Interactive map interface for geographic monitoring stations |
| **Real-Time Client** | Socket.IO Client | `^4.8.3` | Event-driven WebSocket client for live telemetry streaming |
| **HTTP Client** | Axios | `^1.18.1` | Promise-based HTTP client for REST API interaction |
| **Linter** | Oxlint | `^1.71.0` | High-performance JavaScript/JSX linter |

---

## ⚙️ Backend Stack

| Category | Technology / Library | Version | Description |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js | `18+` / `20 Alpine` | JavaScript runtime environment (configured with ES Modules `"type": "module"`) |
| **Web Server Framework** | Express.js | `^4.21.0` | Minimalist and flexible Node.js web application framework |
| **Real-Time Server** | Socket.IO | `^4.7.5` | Real-time bidirectional event-based communication server |
| **Database ODM** | Mongoose | `^8.6.0` | Object Data Modeling library for MongoDB schema enforcement |
| **Authentication** | JSON Web Token (jsonwebtoken) | `^9.0.2` | Token-based secure user authentication |
| **Security & Hashing** | bcryptjs | `^2.4.3` | Password hashing algorithm |
| **Request Validation** | Express Validator | `^7.2.0` | Middleware for input validation and sanitization |
| **IoT Hardware Ingestion** | SerialPort | `^13.0.0` | Node.js serial port stream interface for ESP32 USB connection |
| **Email Service** | Nodemailer | `^6.9.14` | SMTP mail dispatch engine for real-time compliance alerts |
| **Reporting & Exporting** | PDFKit & json2csv | `^0.15.0` / `^6.0.0` | Automated PDF report generation and CSV data exporting |
| **File Uploads** | Multer | `^1.4.5` | Middleware for handling `multipart/form-data` |
| **Logging & Utilities** | Morgan & Cors & dotenv | `^1.10.0` | HTTP request logger, CORS middleware, and environment variable management |

---

## 💾 Database Layer

* **Database Engine**: MongoDB 6+ / 7.0 (NoSQL document store)
* **Data Schemas & Models**:
  * **User**: Roles, credentials, contact info
  * **Device / Station**: Pre/post monitoring station metadata, calibration data, status
  * **Telemetry**: High-frequency sensor readings (pH, TDS, Flow rate)
  * **Alert**: Anomaly alerts, severity thresholds, acknowledgment status
  * **Maintenance & Audit Logs**: System operations and device maintenance logs

---

## 🔌 Hardware & IoT Integration

* **Microcontrollers**: ESP32 / Arduino-compatible microcontrollers
* **Sensors**:
  * **pH Sensors**: Pre-treatment vs post-treatment pH measurement
  * **TDS (Total Dissolved Solids) Sensors**: Water purity & chemical concentration
  * **Flow Rate Sensors**: Volume monitoring to detect bypass or unauthorized extraction
* **Data Transmission**: USB Serial connection (`serialport`) and internal telemetry simulator for offline development

---

## 🐳 Containerization & DevOps

* **Containerization**: Docker multi-stage build (Node 20 Alpine frontend build stage & backend runner stage)
* **Orchestration**: Docker Compose (`docker-compose.yml`) coordinating the app server and MongoDB container (`mongo:7.0`)
* **Environment Configuration**: Configured via `.env` file and Docker environment variables

---

## 📜 Workspace Scripts

| Script Command | Description |
| :--- | :--- |
| `npm run setup` | Installs dependencies for both backend and frontend |
| `npm run dev:backend` | Starts backend development server with Node `--watch` |
| `npm run dev:frontend` | Starts Vite frontend development server |
| `npm run build` | Builds production bundle for the frontend |
| `npm run seed` | Seeds database with initial mockup data |
| `npm start` | Builds frontend and starts production backend server |
