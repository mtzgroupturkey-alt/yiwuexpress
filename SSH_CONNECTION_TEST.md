# 🔐 SSH Connection Test

Before running the full migration, let's test your SSH connection to make sure everything works.

---

## Quick Test (Choose One)

### Option 1: PowerShell (Recommended for Windows)

```powershell
cd c:\wamp64\www\yiwuexpress
.\test-ssh-connection.ps1
```

### Option 2: Git Bash

```bash
cd /c/wamp64/www/yiwuexpress
chmod +x test-ssh-connection.sh
./test-ssh-connection.sh
```

### Option 3: Manual Test

```bash
ssh djdn@39.175.57.2 -p 22
```

Enter your password when prompted.

---

## What the Test Does

The script will:
1. ✅ Verify SSH client is installed
2. ✅ Test network connectivity to server
3. ✅ Connect to your server and show:
   - Server information (OS, hostname)
   - Project directory status
   - Installed tools (Node.js, npm, PM2, Nginx, MySQL)
   - Disk space
   - PM2 process status
   - Database status
   - Site status (if running)

---

## Expected Output

```
=================================================
🔐 Testing SSH Connection to Dromkok Server
=================================================

Server: djdn@39.175.57.2:22

1️⃣  Checking SSH client...
✅ SSH client found
   Version: OpenSSH_8.x

2️⃣  Testing network connectivity...
   Pinging 39.175.57.2...
✅ Server is reachable

3️⃣  Testing SSH connection...
   Attempting to connect to djdn@39.175.57.2...

=================================================
You will be prompted for your SSH password
=================================================

[Enter your password]

✅ SSH Connection Successful!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Hostname:     your-server-hostname
   OS:           Ubuntu 24.04 LTS
   Current User: djdn
   Current Dir:  /home/djdn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 Project Directory Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Project directory exists
   Path: /www/wwwroot/www.dromkok.com/web
   Size: 250M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Server Tools Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Node.js:      v22.x.x ✅
   npm:          10.x.x ✅
   PM2:          5.x.x ✅
   Nginx:        1.x.x ✅
   MySQL:        8.0.x ✅
   Git:          2.x.x ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Disk Space:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total: 50G   Used: 15G (30%)   Available: 35G

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PM2 Process Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────┬────────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ mode    │ ↺       │ status   │
├─────┼────────────────┼─────────┼─────────┼──────────┤
│ 0   │ dromkok-web    │ fork    │ 15      │ online   │
└─────┴────────────────┴─────────┴─────────┴──────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SSH Connection Test Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=================================================
✅ SSH Connection Test PASSED!
=================================================

You are ready to run the migration script:
  .\deploy-to-dromkok.ps1
```

---

## Troubleshooting

### ❌ "ssh: command not found"

**Solution:** Install SSH client

**For PowerShell:**
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client*
```

**Or install Git for Windows** (includes SSH):
- Download: https://git-scm.com/download/win
- Install with default options
- Restart terminal

### ❌ "Permission denied (publickey,password)"

**Possible causes:**
1. Wrong password
2. Wrong username (should be `djdn`)
3. SSH disabled on server

**Solution:**
- Double-check your password
- Verify username is `djdn`
- Contact server administrator if issue persists

### ❌ "Connection timed out"

**Possible causes:**
1. Server is down
2. Firewall blocking port 22
3. Network connectivity issue
4. Wrong server IP

**Solution:**
```bash
# Verify server IP
ping 39.175.57.2

# Try with explicit port
ssh -p 22 djdn@39.175.57.2

# Check if port 22 is open
telnet 39.175.57.2 22
```

### ⚠️ "No route to host"

**Solution:**
- Check your internet connection
- Verify server IP is correct: `39.175.57.2`
- Try from a different network

### ⚠️ "Host key verification failed"

**This means the server's SSH key has changed**

**Solution:**
```bash
# Remove old key (Windows)
ssh-keygen -R 39.175.57.2

# Try connecting again
ssh djdn@39.175.57.2 -p 22
```

---

## Next Steps After Successful Test

### 1. Review Server Information

Look at the test output and verify:
- [ ] Project directory exists
- [ ] All required tools are installed (Node, npm, PM2, Nginx, MySQL)
- [ ] Adequate disk space (at least 10GB free)
- [ ] PM2 process is running (or ready to start)
- [ ] Database is accessible

### 2. Run the Migration

If everything looks good:

```powershell
# Edit the script first (add MySQL password)
notepad deploy-to-dromkok.ps1

# Then run migration
.\deploy-to-dromkok.ps1
```

### 3. Monitor the Process

The migration will:
- Export your local database
- Archive project files
- Upload to server
- Backup production
- Import database
- Extract files
- Build and restart

This takes 30-60 minutes depending on:
- Database size
- Number of files
- Internet speed

---

## Manual SSH Commands

If you prefer to explore manually:

```bash
# Connect to server
ssh djdn@39.175.57.2 -p 22

# Navigate to project
cd /www/wwwroot/www.dromkok.com/web

# Check current status
pwd
ls -la
pm2 status

# View site logs
pm2 logs dromkok-web --lines 50

# Check database
mysql -u root -p

# Exit server
exit
```

---

## Security Notes

- ✅ Use strong SSH password
- ✅ Never share your password
- ✅ Consider setting up SSH keys (more secure)
- ✅ Logout when done: `exit`

### Setup SSH Key (Optional but Recommended)

More secure than password authentication:

```bash
# Generate SSH key on Windows
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy to server
type %USERPROFILE%\.ssh\id_ed25519.pub | ssh djdn@39.175.57.2 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Now you can connect without password
ssh djdn@39.175.57.2
```

---

## Ready to Proceed?

✅ **If SSH test passed:**
→ Run `.\deploy-to-dromkok.ps1`

⚠️ **If SSH test failed:**
→ Review troubleshooting section above
→ Ensure server is accessible
→ Verify credentials

❓ **Need help?**
→ See `YOUR_SERVER_GUIDE.md` for detailed commands
→ See `MIGRATION_GUIDE.md` for complete guide

---

**Test your connection now:**

```powershell
.\test-ssh-connection.ps1
```
