# 🎯 ACTION PLAN - SSL Deployment for www.dromkok.com

**Current Status:** SSH/SCP authentication failed  
**Solution:** Use WinSCP GUI instead  
**Time Required:** 15-20 minutes  
**Difficulty:** Easy

---

## ⚡ IMMEDIATE ACTION (Do This Now)

### Step 1: Download WinSCP (2 minutes)

Click here to download:
**https://winscp.net/eng/download.php**

Or direct link:
**https://winscp.net/files/winscp643setup.exe**

### Step 2: Install WinSCP (3 minutes)

1. Run the installer
2. Click "Next" several times
3. Click "Install"
4. Click "Finish"

### Step 3: Open WinSCP (1 minute)

1. Search for "WinSCP" in Windows
2. Click to open
3. You'll see the login window

---

## 🎯 MAIN TASK (Do This After WinSCP is Open)

### Step 4: Create Connection (2 minutes)

Enter these details in WinSCP:

```
Host name:     39.175.57.2
Port:          22
User name:     root
Password:      [Your SSH password]
```

Then click: **"Login"**

### Step 5: Navigate to SSL Directory (1 minute)

1. In the right panel, enter this path:
   ```
   /etc/nginx/ssl/dromkok.com/
   ```
2. Press Enter

### Step 6: Upload Certificate Files (3 minutes)

1. In the left panel (Windows), navigate to:
   ```
   c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\
   ```

2. Select all 4 files:
   - dromkok.com_bundle.crt
   - dromkok.com.key
   - dromkok.com_bundle.pem
   - dromkok.com.csr

3. Drag them to the right panel
4. Wait for upload to complete (shows progress)
5. Done! ✅

### Step 7: Set Permissions (2 minutes)

For each file:

**Certificates:**
- dromkok.com_bundle.crt → Right-click → Permissions → **644** → OK
- dromkok.com_bundle.pem → Right-click → Permissions → **644** → OK

**Private Key (IMPORTANT!):**
- dromkok.com.key → Right-click → Permissions → **600** → OK

---

## 🚀 FINAL STEP (Back to Command Line)

### Step 8: Deploy on Server (3 minutes)

1. **Close WinSCP**

2. **Open Command Prompt or PowerShell**

3. **SSH to server:**
   ```powershell
   ssh root@39.175.57.2
   ```
   (Enter your password)

4. **Run deployment script:**
   ```bash
   bash /root/deploy_ssl.sh
   ```
   
   The script will:
   - Set permissions
   - Test nginx config
   - Reload nginx
   - Verify everything

5. **Wait for completion** (1-2 minutes)
   - You'll see: "✨ SSL Deployment Complete!"

---

## ✅ VERIFICATION (2 minutes)

### Check in Browser:

1. Open browser
2. Go to: **https://www.dromkok.com**
3. You should see:
   - ✅ Website loads
   - ✅ Secure lock icon in address bar
   - ✅ No certificate warnings

### Check with Command:

```bash
# While SSH'd into server
curl -I https://www.dromkok.com

# Should show: HTTP/2 200
```

### Check Online:

Visit: **https://www.ssllabs.com/ssltest/?d=www.dromkok.com**

Wait a few minutes for analysis. Target: **Grade A or A+**

---

## 📋 COMPLETE CHECKLIST

- [ ] Downloaded WinSCP
- [ ] Installed WinSCP
- [ ] Opened WinSCP
- [ ] Created connection to 39.175.57.2
- [ ] Navigated to /etc/nginx/ssl/dromkok.com/
- [ ] Uploaded all 4 certificate files
- [ ] Set permissions (644 for certs, 600 for key)
- [ ] Closed WinSCP
- [ ] SSH'd to server: `ssh root@39.175.57.2`
- [ ] Ran deployment: `bash /root/deploy_ssl.sh`
- [ ] Deployment completed successfully
- [ ] Tested: https://www.dromkok.com
- [ ] Verified: Secure lock icon present
- [ ] Checked: No certificate warnings
- [ ] (Optional) Checked SSL Labs rating

---

## ⏱️ TIME ESTIMATE

| Step | Task | Time |
|------|------|------|
| 1 | Download WinSCP | 2 min |
| 2 | Install WinSCP | 3 min |
| 3 | Open WinSCP | 1 min |
| 4 | Create connection | 2 min |
| 5 | Navigate directory | 1 min |
| 6 | Upload files | 3 min |
| 7 | Set permissions | 2 min |
| 8 | SSH & deploy script | 3 min |
| 9 | Verify in browser | 2 min |
| **TOTAL** | **End-to-end** | **~19 minutes** |

---

## 🆘 IF SOMETHING GOES WRONG

### WinSCP Won't Connect
→ See: **SSH_TROUBLESHOOTING.md**

### WinSCP Upload Fails
→ Check disk space on server: `df -h`

### Deployment Script Fails
→ Check permissions were set correctly

### Browser Shows Certificate Error
→ Wait 1-2 minutes for DNS propagation
→ Check file permissions on server

### Need Help?
→ See: **WINSCP_SETUP_GUIDE.md**
→ See: **SSH_TROUBLESHOOTING.md**
→ Contact: Server administrator

---

## 🎯 WHAT HAPPENS AFTER DEPLOYMENT

✅ **Automatic:**
- All HTTP traffic → HTTPS (automatic redirect)
- Certificate renewed annually (contact provider)
- SSL/TLS protection active 24/7
- Security headers enforced
- Gzip compression enabled
- Performance optimized

⚠️ **You Need To:**
- Note certificate expiration date (90 days warning)
- Set calendar reminder for renewal
- Monitor error logs weekly
- Check SSL rating monthly

---

## 📞 QUICK REFERENCE

| Question | Answer | Document |
|----------|--------|----------|
| How do I use WinSCP? | Step-by-step guide | WINSCP_SETUP_GUIDE.md |
| SSH connection fails | Troubleshooting steps | SSH_TROUBLESHOOTING.md |
| Need complete info | Full deployment guide | SSL_DEPLOYMENT_GUIDE.md |
| Want to verify? | 10-point test script | verify_certificate.sh |
| Need nginx config? | Production ready | nginx_ssl_config.conf |

---

## 🎉 EXPECTED OUTCOME

After following this action plan:

✅ SSL certificates uploaded to server  
✅ Nginx configured with HTTPS  
✅ HTTP automatically redirects to HTTPS  
✅ Browser shows secure lock icon  
✅ https://www.dromkok.com works perfectly  
✅ SSL Labs rating: A or A+  
✅ Your platform is now secure! 🔒  

---

## 🚀 START NOW!

### Step 1: Download WinSCP
**https://winscp.net/eng/download.php**

### Step 2: Follow This Action Plan
Everything is outlined above. Just follow the steps!

### Step 3: Verify Success
https://www.dromkok.com should load securely ✅

---

**Estimated time to complete: ~20 minutes**

**Status: Ready to begin! 🎯**

---

## 💡 IMPORTANT REMINDERS

⏰ **Certificate Expiration:**
- Find expiration date in WinSCP or terminal
- Set calendar reminder 90 days before
- Renew 60 days before expiration

🔐 **Private Key:**
- chmod 600 (readable only by owner)
- Never share with anyone
- Keep backed up securely

📊 **Monitoring:**
- Check error logs: `/var/log/nginx/error.log`
- Monitor SSL rating: https://www.ssllabs.com/
- Review security headers: https://securityheaders.com/

---

**Questions? See the documentation files in this folder!**

**Ready to begin? Download WinSCP and start with Step 1! 🚀**
