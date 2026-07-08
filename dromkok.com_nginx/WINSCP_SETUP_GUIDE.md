# 🖥️ WinSCP Setup Guide - SSL Certificate Upload

**If SCP command failed, WinSCP is your easiest solution!**

This guide shows how to upload your SSL certificates using WinSCP GUI (graphical interface).

---

## ⬇️ Step 1: Download WinSCP

### Option A: Direct Download
Visit: **https://winscp.net/eng/download.php**

Click: **"Download WinSCP"** (portable or installer)

### Option B: Quick Download Link
- **Installer:** https://winscp.net/files/winscp643setup.exe
- **Portable:** https://winscp.net/files/WinSCP-6.3-Portable.zip

**System Requirements:**
- Windows XP or later
- ~6 MB disk space
- No administrator privileges needed

---

## 🔧 Step 2: Install WinSCP

### If Downloaded Installer (.exe)
1. Double-click: `WinSCP*.exe`
2. Click: **"Next"**
3. Choose: **Install** (or portable if you prefer)
4. Click: **"Install"**
5. Click: **"Finish"**

### If Downloaded Portable (.zip)
1. Extract the ZIP file anywhere
2. Double-click: `WinSCP.exe`
3. Done! (No installation needed)

**Launch WinSCP:**
- Windows: Search for "WinSCP" and click
- Or double-click `WinSCP.exe`

---

## 🌐 Step 3: Create New Connection

### In WinSCP Main Window:

1. **Click: "New Session"** (or File → New)

   You'll see the login dialog

2. **Enter these details:**

   | Field | Value |
   |-------|-------|
   | **Host name** | `39.175.57.2` |
   | **Port number** | `22` |
   | **User name** | `root` |
   | **Password** | `[Your SSH password]` |
   | **Protocol** | `SSH` (default) |

   **Visual Guide:**
   ```
   ┌─────────────────────────────────────────┐
   │ New Session / Edit Site                  │
   ├─────────────────────────────────────────┤
   │ Session name: my-server                  │
   │ Host name: 39.175.57.2                   │
   │ Port number: 22                          │
   │ User name: root                          │
   │ Password: ••••••••••                     │
   │ Protocol: SSH ✓                          │
   │                                         │
   │ [Save] [Save and Close] [Connect]       │
   └─────────────────────────────────────────┘
   ```

3. **Click: "Save"** (to save for future use)

4. **Click: "Login"** (to connect now)

### First Time Connection

You may see a warning:

```
The server's host key was not found in the cache.
Do you want to continue?
```

**Click: "Yes"** to accept and continue

---

## 📁 Step 4: Navigate to SSL Directory

### After Connected:

1. You'll see **two panels:**
   - Left: Your Windows files
   - Right: Server files

2. **On the RIGHT panel (server), navigate:**
   - Type or click into: `/etc/nginx/ssl/dromkok.com/`
   
   Or:
   - Click the path bar at top
   - Type: `/etc/nginx/ssl/dromkok.com/`
   - Press: **Enter**

3. **Directory may be empty** (if not created yet)

   If directory doesn't exist:
   - Right-click → New → Directory
   - Name: `dromkok.com`
   - Create it

---

## 📤 Step 5: Upload Certificate Files

### From LEFT Panel (Windows):

Navigate to your certificate files:
```
c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\
```

You should see these files:
- `dromkok.com_bundle.crt` ✓
- `dromkok.com.key` ✓
- `dromkok.com_bundle.pem` ✓
- `dromkok.com.csr` ✓

### Upload Method 1: Drag & Drop (Easiest)

1. **Select all 4 files** (Ctrl+A)
2. **Drag** them to the RIGHT panel
3. Wait for upload to complete
4. Done! ✅

### Upload Method 2: Right-Click Menu

1. **Select** the 4 files
2. **Right-click** → "Upload"
3. Confirm upload
4. Wait for completion
5. Done! ✅

### Upload Method 3: Menu

1. **Select** the 4 files
2. **Menu** → Commands → Upload
3. Confirm
4. Done! ✅

---

## ✅ Step 6: Verify Upload

After upload, you should see:

**In RIGHT panel (server):**
```
dromkok.com_bundle.crt    [✓ Uploaded]
dromkok.com.key           [✓ Uploaded]
dromkok.com_bundle.pem    [✓ Uploaded]
dromkok.com.csr           [✓ Uploaded]
```

**Check file sizes match:**

| File | Expected Size |
|------|----------------|
| dromkok.com_bundle.crt | ~2.3 KB |
| dromkok.com.key | ~1.7 KB |
| dromkok.com_bundle.pem | ~2.3 KB |
| dromkok.com.csr | ~1.1 KB |

---

## 🔐 Step 7: Set File Permissions

### For Security, Change Permissions:

Right-click each file:

**For certificate files:**
- `dromkok.com_bundle.crt` → Properties
- Permissions: `644` (readable by all)
- OK

- `dromkok.com_bundle.pem` → Properties
- Permissions: `644` (readable by all)
- OK

**For private key (CRITICAL!):**
- `dromkok.com.key` → Properties
- Permissions: `600` (readable ONLY by owner)
- OK

**Visual Guide:**
```
┌─────────────────────────────────┐
│ File Properties                  │
├─────────────────────────────────┤
│ Owner (user): ☑ ☑ ☑             │
│ Group: ☐ ☐ ☑                     │
│ Other: ☐ ☐ ☑                     │
│                                 │
│ Result: 644 (or 600 for key)    │
│ [OK] [Cancel]                   │
└─────────────────────────────────┘
```

---

## 🚀 Step 8: Next Steps on Server

### Close WinSCP

Now you need to run the deployment script on the server.

**SSH into server:**

1. Open Command Prompt or PowerShell
2. Type:
   ```bash
   ssh root@39.175.57.2
   ```
3. Enter your password
4. You're now on the server!

### Run Deployment Script

Once SSH'd into server:

```bash
# Make script executable
chmod +x /root/deploy_ssl.sh

# Run deployment script
sudo bash /root/deploy_ssl.sh
```

Or use the simpler one-liner:
```bash
bash /root/deploy_ssl.sh
```

The script will:
- ✅ Set permissions automatically
- ✅ Test nginx configuration
- ✅ Reload nginx
- ✅ Verify everything works

---

## 📋 Complete Workflow Summary

```
1. Download WinSCP
   ↓
2. Install WinSCP
   ↓
3. Create new session (39.175.57.2)
   ↓
4. Navigate to /etc/nginx/ssl/dromkok.com/
   ↓
5. Upload 4 certificate files (drag & drop)
   ↓
6. Set permissions (644 for certs, 600 for key)
   ↓
7. Close WinSCP
   ↓
8. SSH to server: ssh root@39.175.57.2
   ↓
9. Run: bash /root/deploy_ssl.sh
   ↓
10. Verify: https://www.dromkok.com ✅
```

---

## 🎯 WinSCP Tips & Tricks

### Bookmark Your Connection
1. After connecting
2. Click: Session → Save Session
3. Give it a name: "YIWU-EXPRESS-SSL"
4. Next time, just select from list!

### Keep Connection Open
- Check: "Keep remote directory up to date"
- This auto-refreshes server files

### Keyboard Shortcuts
- `Ctrl+U` - Upload selected files
- `Ctrl+D` - Download selected files
- `F5` - Refresh
- `Ctrl+S` - Save settings

### Double-Click to View
- Double-click any file to view contents
- Useful for checking configs before saving

---

## ⚠️ Troubleshooting

### Issue: "Cannot Connect to Server"

**Solutions:**
1. Check IP address: Is it `39.175.57.2`?
2. Check SSH port: Make sure it's `22`
3. Check firewall: Is port 22 open?
4. Try: `ping 39.175.57.2` in Command Prompt first

### Issue: "Authentication Failed"

**Solutions:**
1. Check password: Did you type it correctly?
2. Try: `ssh root@39.175.57.2` manually first
3. Check username: Should be `root` (not admin)
4. Try: Different user account if root fails

### Issue: "Permission Denied"

**Solutions:**
1. Check user: Are you logged in as root?
2. Try: `sudo -s` if you need admin
3. Check directory: Does `/etc/nginx/` exist?
4. Try: Creating `/etc/nginx/ssl/` first

### Issue: "Upload Fails"

**Solutions:**
1. Check disk space: Is server full?
2. Check permissions: Does user have write access?
3. Try: Upload to `/tmp` first to test
4. Check file: Is file corrupted? Try re-downloading

---

## 🔒 Security Notes

### Private Key Protection
⚠️ When you see `dromkok.com.key`:
- This is your private encryption key
- **Never share it**
- **Never email it**
- **Keep it secure**
- Set permissions to `600` (owner only)

### Connection Security
✅ WinSCP uses SSH (encrypted)
✅ Your password is encrypted
✅ File transfers are encrypted
✅ Safe to use over internet

---

## ✅ Verification Checklist

After upload via WinSCP:

- [ ] Connected to 39.175.57.2 successfully
- [ ] Navigated to `/etc/nginx/ssl/dromkok.com/`
- [ ] All 4 files uploaded
- [ ] File sizes match expected
- [ ] Permissions set (644 for certs, 600 for key)
- [ ] Can SSH to server
- [ ] Can run deploy_ssl.sh script
- [ ] Script shows "Deployment Complete"

---

## 📞 Alternative: If WinSCP Doesn't Work

### FileZilla (Alternative)
1. Download: https://filezilla-project.org/
2. Same workflow as WinSCP
3. Often more reliable

### Cyberduck (Mac/Windows)
1. Download: https://cyberduck.io/
2. Similar drag-drop interface

### Command Line Alternative
Once you have SSH working:

```bash
# Copy files via SSH
ssh root@39.175.57.2 << 'EOF'
mkdir -p /etc/nginx/ssl/dromkok.com
EOF

# Then use SCP (this time it might work)
scp dromkok.com_nginx/* root@39.175.57.2:/etc/nginx/ssl/dromkok.com/
```

---

## 🎉 You're Ready!

With WinSCP, uploading certificates is as easy as:

1. ✅ Open WinSCP
2. ✅ Connect to server
3. ✅ Navigate to directory
4. ✅ Drag & drop files
5. ✅ Set permissions
6. ✅ Done!

Then run the deployment script on server and you're finished!

---

**For more help:**
- WinSCP Official Docs: https://winscp.net/eng/docs/
- SCP/SFTP Help: https://winscp.net/eng/docs/faq
- SSH Troubleshooting: https://winscp.net/eng/docs/faq_troubleshoot

**Time to complete:** ~10-15 minutes including WinSCP download
