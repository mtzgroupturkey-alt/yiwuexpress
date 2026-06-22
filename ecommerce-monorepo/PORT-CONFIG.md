# 🔧 Port Configuration Guide

This document defines the standard ports for the YIWU EXPRESS development environment.

## Port Assignments

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Backend API** | 3001 | http://localhost:3001 | Next.js backend server |
| **Mobile Expo** | 8081 | http://localhost:8081 | Expo Metro bundler (web) |
| **Frontend Web** | 3000 | http://localhost:3000 | Next.js frontend (if separate) |

## Configuration Files

### Backend (Next.js API)
- **File**: `web/.env.local`
- **Variable**: `PORT=3001`

### Mobile (React Native/Expo)
- **File**: `mobile/src/api/client.ts`
- **Variable**: Backend API port hardcoded to 3001

### Scripts
- **Backend**: `web/package.json` → `"dev": "node server.js"`
- **Mobile**: `mobile/package.json` → `"start": "expo start --port 8081"`

## How to Change Ports

If you need to change ports in the future:

1. **Backend Port (3001)**:
   - Edit `web/.env.local` → Change `PORT=3001`
   - Edit `mobile/src/api/client.ts` → Update port in API URL
   - Restart backend server

2. **Mobile Port (8081)**:
   - Edit `mobile/package.json` → Update `--port` flag
   - Restart Expo

## Troubleshooting

### Port Already in Use
```bash
# Windows: Find what's using a port
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F
```

### CORS Errors
- Ensure backend is running on port 3001
- Check `web/.env.local` has correct ALLOWED_ORIGINS
- Restart backend after .env changes

### Connection Refused
- Verify backend is running: http://localhost:3001/api/services
- Check firewall isn't blocking the ports
- Ensure no antivirus is interfering
