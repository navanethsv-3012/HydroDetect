# Deployment Guide

## Production Deployment Architecture

```
[ ESP32 Hardware / Simulator ] ──> [ Express + Socket.IO Server ] <──> [ MongoDB Database ]
                                              ▲
                                              │ HTTP / WS
                                     [ Nginx Reverse Proxy ]
                                              ▲
                                              │
                                     [ Vite React Frontend ]
```

## Production Build Steps

### 1. Build Frontend Static Assets
```bash
cd frontend
npm run build
```
This generates the optimized static bundle in `frontend/dist`.

### 2. Configure Production Backend Environment
In `backend/.env`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/aquasentinel
JWT_SECRET=<strong-production-secret-key>
FRONTEND_URL=https://aquasentinel.yourdomain.com
```

### 3. Process Management (PM2)
Install PM2 globally to ensure automatic restarts and zero-downtime reloads:
```bash
npm install -g pm2
cd backend
pm2 start server.js --name "aquasentinel-backend"
pm2 save
pm2 startup
```

### 4. Reverse Proxy Setup (Nginx)
Sample Nginx configuration for SSL termination, static frontend hosting, and Socket.IO WebSocket proxying:

```nginx
server {
    listen 80;
    server_name aquasentinel.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aquasentinel.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/aquasentinel.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aquasentinel.yourdomain.com/privkey.pem;

    # Frontend Static Files
    location / {
        root /var/www/aquasentinel/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
