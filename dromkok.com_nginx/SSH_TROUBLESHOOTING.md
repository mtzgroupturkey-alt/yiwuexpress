# 🔧 SSH/SCP Troubleshooting Guide

**Error:** "Permission denied, please try again."

This guide helps you diagnose and fix SSH connection issues.

---

## 🔍 Diagnosis Steps

### Step 1: Test Basic SSH Connection

Before trying SCP, test if SSH works at all:

```powershell
ssh -v root@39.175.57.2
```

The `-v` flag shows verbose output (helpful for debugging).

**What you should see:**
- `Connecting to 39.175.57.2...`
- `Connected!`
- `password:` prompt
- Then it connects successfully

**Common Issues:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Connection refused` | Server not listening | Check IP, check firewall |
| `Host not found` | Wrong IP address | Verify: `39.175.57.2` |
| `Connection timeout` | Server unreachable | Check network, firewall |
| `Permission denied` | Wrong password | Try password again |
| `No such file/directory` | OpenSSH not installed | Install OpenSSH |

---

## 🔑 Step 2: Verify Your Password

### Test with verbose output:

```powershell
ssh -v root@39.175.57.2
```

When prompted for password:
- **Type slowly** - Ensure password is correct
- **Check CAPS LOCK** - Passwords are case-sensitive
- **Paste from password manager** - Reduces typos
- **Try 3 times** - After 3 failures, connection closes

### If Password Fails:

1. **Confirm correct credentials with:**
   - Server administrator
   - Your SSH setup documentation
   - Password manager/vault

2. **Try password without special characters first:**
   - Remove: `!@#$%^&*()`
   - Try simpler password if available

3. **Check if account is:**
   - Locked (contact admin)
   - Expired (contact admin)
   - Disabled (contact admin)

---

## 🌐 Step 3: Verify Server is Reachable

### Test connectivity:

```powershell
# Test if server is online
ping 39.175.57.2

# Should see responses like:
# Pinging 39.175.57.2 with 32 bytes of data:
# Reply from 39.175.57.2: bytes=32 time=45ms TTL=64
```

### If ping fails:

```
Problems:
- Server is offline
- Firewall blocking ICMP
- Wrong IP address
- Network connectivity issue

Solutions:
- Check server status with provider
- Verify IP address
- Check your internet connection
- Try different network (mobile hotspot)
```

---

## 🔌 Step 4: Verify Port 22 is Open

### Check if SSH port is accessible:

```powershell
# Check if port 22 is open (on Windows 10+)
Test-NetConnection 39.175.57.2 -Port 22

# Output should show:
# TcpTestSucceeded : True  ✓ (Port is open)
# TcpTestSucceeded : False ✗ (Port is closed)
```

### If port 22 is closed:

**Possible reasons:**
- SSH server not running on server
- Firewall blocking port 22
- Server configuration disabled SSH
- Wrong port number

**Solutions:**
- Contact server administrator
- Check server firewall rules
- Verify SSH service is running
- Try different port if SSH is on non-standard port

---

## 💻 Step 5: Ensure OpenSSH is Installed

### Check if OpenSSH is available on Windows:

```powershell
# Check for OpenSSH Client
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Output example:
# Name  : OpenSSH.Client~~~~0.0.1.0
# State : Installed  ✓
```

### If not installed:

**Option A: Install via PowerShell (Windows 10+)**

```powershell
# Run as Administrator
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Verify installation
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

**Option B: Download OpenSSH**

1. Visit: https://github.com/PowerShell/Win32-OpenSSH/releases
2. Download: `OpenSSH-Win64.zip`
3. Extract to: `C:\Program Files\OpenSSH\`
4. Add to PATH if needed

**Option C: Use Alternative Tools**

- **Git Bash** (includes SSH): https://git-scm.com/
- **PuTTY**: https://www.putty.org/
- **Cygwin**: https://www.cygwin.com/
- **Windows Subsystem for Linux**: WSL

---

## 🔐 Step 6: Check SSH Authentication Method

### Verify your authentication type:

```powershell
# Try with verbose output to see authentication method
ssh -v root@39.175.57.2 2>&1 | Select-String "auth"

# Look for:
# - "password authentication" → Password-based
# - "publickey" → Key-based authentication needed
```

### If using key-based authentication:

If you see "publickey" in output, you need SSH keys:

```powershell
# If you have a private key file
ssh -i C:\path\to\private_key root@39.175.57.2

# If key is PuTTY format (.ppk)
# Use PuTTY instead of cmd SSH
```

---

## 🛠️ Step 7: Manual Troubleshooting

### Try each of these in order:

**Test 1: Verify IP Address**
```powershell
# Ping to confirm server is online
ping 39.175.57.2

# Expected: Pinging 39.175.57.2... Reply from 39.175.57.2
# Problem: Request timed out or "Host not found"
```

**Test 2: Verify Port is Open**
```powershell
# Check if SSH port is accessible
Test-NetConnection 39.175.57.2 -Port 22

# Expected: TcpTestSucceeded : True
# Problem: TcpTestSucceeded : False
```

**Test 3: Try SSH Connection**
```powershell
# Try basic SSH connection
ssh root@39.175.57.2

# Enter password when prompted
# If successful, you'll get a shell prompt ($)
# If fails, you'll get an error message
```

**Test 4: Check with Verbose Output**
```powershell
# Get detailed debugging information
ssh -vvv root@39.175.57.2

# This shows exactly where connection fails
# Copy output for support if needed
```

**Test 5: Try Different Username**
```powershell
# If 'root' doesn't work, try:
ssh admin@39.175.57.2
ssh ubuntu@39.175.57.2
ssh ec2-user@39.175.57.2
ssh centos@39.175.57.2

# Try with service-specific names
# Or ask administrator for correct user
```

---

## 🎯 Quick Decision Tree

```
Does ping 39.175.57.2 work?
├─ NO  → Server unreachable
│       → Check IP address
│       → Check network connection
│       → Check provider status
│
└─ YES → Is port 22 open? (Test-NetConnection)
         ├─ NO  → Firewall blocking SSH
         │       → Contact server admin
         │       → Check server firewall rules
         │
         └─ YES → Try SSH connection
                  ├─ Permission denied
                  │  → Wrong password
                  │  → Wrong username
                  │  → Check credentials again
                  │
                  ├─ Cannot connect
                  │  → Check authentication method
                  │  → Check if key-based auth needed
                  │
                  └─ Connected! ✓
                     → Try SCP now
                     → Deploy SSL
```

---

## ✅ When SSH Works

Once you have a working SSH connection:

```powershell
# Now try SCP
scp -r "c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\*" `
    root@39.175.57.2:/etc/nginx/ssl/dromkok.com/

# Or use the automated script
bash /root/deploy_ssl.sh
```

---

## 🎯 Recommended Alternative: Use WinSCP

If SSH/SCP continues to have issues, **use WinSCP instead:**

✅ **Benefits:**
- Graphical user interface (easier)
- Better error messages
- Drag-and-drop file transfer
- No command line needed
- Clear file browser

📖 **See:** WINSCP_SETUP_GUIDE.md (in this folder)

**Download:** https://winscp.net/

---

## 📞 Collecting Debug Information

If you need to contact support, collect this info:

```powershell
# Test 1: Connectivity
Write-Host "=== CONNECTIVITY TEST ==="
ping 39.175.57.2

# Test 2: Port Check
Write-Host "`n=== PORT 22 CHECK ==="
Test-NetConnection 39.175.57.2 -Port 22

# Test 3: SSH with verbose output
Write-Host "`n=== SSH VERBOSE TEST ==="
ssh -vvv root@39.175.57.2 2>&1 | Out-File ssh_debug.txt

# Test 4: Check OpenSSH
Write-Host "`n=== OPENSSH CHECK ==="
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

Copy output and send to support.

---

## 🎯 Final Recommendations

### If You're Not Technical:
✅ **Use WinSCP** → Much easier than command line

### If You Want to Troubleshoot:
✅ Follow the diagnosis steps above
✅ Run verbose SSH test
✅ Share error output with support

### If You're Familiar with SSH:
✅ Use OpenSSH in PowerShell
✅ Try key-based authentication
✅ Check server-side logs

### Quick Decision:
**Having trouble?** → Download WinSCP (10 minutes to complete)  
**Want command line?** → Follow troubleshooting steps

---

## 📚 External Resources

- **OpenSSH Docs:** https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview
- **SSH Issues:** https://superuser.com/questions/tagged/ssh
- **WinSCP Help:** https://winscp.net/eng/docs/faq
- **PuTTY Docs:** https://www.chiark.greenend.org.uk/~sgtatham/putty/docs.html

---

## ✨ Summary

**Error: "Permission denied"** usually means:
1. Wrong password (most common)
2. Wrong username
3. Authentication method issue
4. Server not accepting SSH

**Solutions (in order):**
1. Verify correct password
2. Verify correct username (root)
3. Test SSH connection with verbose flag
4. Use WinSCP GUI instead
5. Contact server administrator

**Time to resolve:** 5-30 minutes depending on issue

**Quickest path forward:** Download WinSCP and use GUI (10 minutes)
