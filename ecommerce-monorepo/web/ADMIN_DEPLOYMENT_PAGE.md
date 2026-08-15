# Admin Deployment Management Page

## ✅ What Was Created

A complete **Admin Panel UI** for managing production deployments directly from your Next.js admin dashboard.

### 📁 Files Created

#### **Frontend (Admin Page)**
```
web/app/admin/deployment/page.tsx ✅
```

#### **Backend (API Routes)**
```
web/app/api/admin/deployment/
├── status/route.ts          ✅ Get PM2 server status
├── deploy/route.ts          ✅ Trigger deployment
├── logs/route.ts            ✅ View deployment logs
├── history/route.ts         ✅ Get deployment history
├── backups/route.ts         ✅ List database backups
├── backup/route.ts          ✅ Create manual backup
├── rollback/route.ts        ✅ Rollback to backup
└── download-backup/route.ts ✅ Download backup file
```

#### **Navigation**
```
web/app/admin/layout.tsx     ✅ Updated with deployment link
```

## 🎨 Features

### 1. **Real-Time Server Status**
- ✅ Server status (Online/Offline)
- ✅ Uptime monitoring
- ✅ Memory usage
- ✅ CPU usage
- ✅ Restart count
- ✅ Auto-refresh every 30 seconds

### 2. **One-Click Deployment**
- ✅ Deploy to production with one click
- ✅ Real-time deployment progress
- ✅ Automatic database backup before deployment
- ✅ Safe migrations (no data loss)
- ✅ Automatic server restart

### 3. **Database Management**
- ✅ View all database backups
- ✅ Create manual backups
- ✅ Download backup files
- ✅ One-click rollback to any backup
- ✅ Automatic backup before each deployment

### 4. **Deployment History**
- ✅ View last 10 deployments
- ✅ Deployment status (Success/Failed/In-Progress)
- ✅ Deployment duration
- ✅ Commit information
- ✅ Author tracking

### 5. **Live Logs Viewer**
- ✅ View deployment logs in real-time
- ✅ Syntax highlighting
- ✅ Last 100 lines of logs
- ✅ Refresh on demand

## 📍 Access the Page

### URL
```
https://www.dromkok.com/admin/deployment
```

Or navigate from admin panel:
```
Admin Panel → Settings → Deployment
```

## 🎯 How to Use

### **Deploy to Production**

1. Login to admin panel
2. Go to **Settings → Deployment**
3. Click **"Deploy to Production"** button
4. Confirm deployment
5. Monitor progress in real-time

### **View Server Status**

The server status card shows:
- **Status**: Online/Offline indicator
- **Uptime**: How long server has been running
- **Memory**: Current memory usage
- **CPU**: Current CPU usage
- **Restarts**: Number of times restarted

### **Create Database Backup**

1. Click **"Create Backup"** button
2. Wait for confirmation
3. Backup appears in **Backups** tab

### **Rollback Database**

1. Go to **Backups** tab
2. Find the backup you want to restore
3. Click **"Rollback"** button
4. Confirm rollback
5. Server automatically restarts

### **Download Backup**

1. Go to **Backups** tab
2. Click **"Download"** button next to any backup
3. Backup file (.sql.gz) downloads to your computer

### **View Deployment Logs**

1. Go to **Logs** tab
2. See last 100 lines of deployment log
3. Click **"Refresh Logs"** to update
4. Syntax highlighted for readability

## 🔒 Security Features

### **Authentication Required**
- ✅ Only admin users can access
- ✅ JWT token validation
- ✅ Session-based security

### **Production-Only Actions**
- ✅ Deployment only works in production
- ✅ Rollback only works in production
- ✅ Development mode shows mock data

### **Safe Operations**
- ✅ Database backup before every deployment
- ✅ Confirmation dialogs for critical actions
- ✅ Error handling with user-friendly messages
- ✅ Validation prevents dangerous operations

## 🚀 Development vs Production

### **Development Mode** (Local)
When running locally (`npm run dev`):
- Shows mock data for testing UI
- Deployment buttons are informational only
- No actual deployments or backups
- Safe for testing interface

### **Production Mode** (Server)
When running on server:
- Real PM2 process monitoring
- Actual deployment execution
- Real database backups
- Live server management

## 🎨 UI Components

### **Status Card**
```tsx
- Server status badge (green=online, red=offline)
- Real-time metrics (uptime, memory, CPU)
- Auto-refresh every 30 seconds
- Manual refresh button
```

### **Action Buttons**
```tsx
- Deploy to Production (blue)
- Create Backup (green)
- Rollback (orange, in backups tab)
- Download (gray, in backups tab)
```

### **Tabs**
```tsx
1. Deployment History - Past deployments
2. Logs - Real-time deployment logs
3. Backups - Database backup management
```

## 📊 API Endpoints

### GET `/api/admin/deployment/status`
Returns server status from PM2

**Response:**
```json
{
  "status": "online",
  "uptime": "5h 23m",
  "memory": "345.67 MB",
  "cpu": "12%",
  "restarts": 0
}
```

### POST `/api/admin/deployment/deploy`
Triggers production deployment

**Response:**
```json
{
  "message": "Deployment started successfully",
  "status": "in-progress"
}
```

### GET `/api/admin/deployment/logs`
Returns last 100 lines of deployment log

**Response:**
```json
{
  "logs": "deployment log content..."
}
```

### GET `/api/admin/deployment/history`
Returns last 10 deployments

**Response:**
```json
[
  {
    "timestamp": "2026-07-13T12:00:00Z",
    "status": "success",
    "duration": "2m 15s",
    "commit": "Add deployment pipeline",
    "author": "Developer"
  }
]
```

### GET `/api/admin/deployment/backups`
Lists all database backups

**Response:**
```json
[
  {
    "filename": "db_backup_20260713_120000.sql.gz",
    "size": "12.5 MB",
    "date": "2026-07-13 12:00:00"
  }
]
```

### POST `/api/admin/deployment/backup`
Creates manual database backup

**Response:**
```json
{
  "message": "Database backup created successfully",
  "output": "backup creation output"
}
```

### POST `/api/admin/deployment/rollback`
Rollback database to specified backup

**Request:**
```json
{
  "backup": "db_backup_20260713_120000.sql.gz"
}
```

**Response:**
```json
{
  "message": "Rollback completed successfully",
  "backup": "db_backup_20260713_120000.sql.gz"
}
```

### GET `/api/admin/deployment/download-backup?file=<filename>`
Downloads backup file

## 🔧 Customization

### Change Colors
Edit the Tailwind classes in `page.tsx`:
```tsx
// Success color
className="bg-green-600 hover:bg-green-700"

// Primary action color
className="bg-blue-600 hover:bg-blue-700"

// Danger color
className="bg-orange-600 hover:bg-orange-700"
```

### Change Refresh Interval
Edit the `useEffect` in `page.tsx`:
```tsx
// Current: 30 seconds
const interval = setInterval(() => {
  fetchServerStatus();
}, 30000);

// Change to 60 seconds:
}, 60000);
```

### Add Notifications
Integrate with your notification system:
```tsx
// Replace alert() calls with your notification component
alert('Deployment started successfully!');
// Change to:
showNotification('Deployment started successfully!', 'success');
```

## 🧪 Testing

### Test in Development
```bash
# Start dev server
npm run dev

# Visit admin deployment page
http://localhost:3001/admin/deployment

# Features work with mock data:
- View interface
- Test UI interactions
- Check responsive design
```

### Test in Production
```bash
# After deployment to server
https://www.dromkok.com/admin/deployment

# Test features:
1. Check server status
2. Create manual backup
3. Run deployment
4. View logs
5. Test rollback
6. Download backup
```

## ⚠️ Important Notes

### Deployment Requirements
- ✅ Must be logged in as admin
- ✅ Only works in production environment
- ✅ Requires PM2 to be running
- ✅ Requires deploy.sh script on server

### Safety Warnings
- ⚠️ Rollback restores database to previous state
- ⚠️ Any data after backup will be lost
- ⚠️ Always create backup before major changes
- ⚠️ Test deployments during low-traffic times

## 📝 Troubleshooting

### "Deployment is only available in production"
**Solution**: You're in development mode. This is expected. Deploy to server to use real features.

### Server status shows "Offline"
**Solutions**:
1. Check PM2: `pm2 status`
2. Restart PM2: `pm2 restart dromkok-shop`
3. Check server.js is running

### Deployment doesn't start
**Solutions**:
1. Check deploy.sh has execute permissions
2. Verify deploy.sh path in API route
3. Check deployment logs on server
4. SSH to server and run `./deploy.sh` manually

### Backups not showing
**Solutions**:
1. Check backup directory exists: `/home/djdn/backups/`
2. Run manual backup first
3. Check permissions on backup directory

### Logs not displaying
**Solutions**:
1. Check deploy.log exists on server
2. Verify log file path in API route
3. Run a deployment to generate logs

## 🎉 Summary

You now have a **complete deployment management interface** in your admin panel with:

✅ **Real-time monitoring** - Live server status  
✅ **One-click deployment** - Deploy from admin panel  
✅ **Database backups** - Create and manage backups  
✅ **Easy rollback** - Restore database anytime  
✅ **Deployment history** - Track all deployments  
✅ **Live logs** - Monitor deployment progress  
✅ **Download backups** - Save backups locally  

**Access**: `https://www.dromkok.com/admin/deployment`

---

**Created**: 2026-07-13  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
