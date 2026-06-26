# Install Missing Shadcn/UI Components

## ⚠️ IMPORTANT: Run these commands one by one

Navigate to the web directory first:
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
```

Then run each command:

```bash
# Form components
npx shadcn-ui@latest add form

# Table component
npx shadcn-ui@latest add table

# Dialog component
npx shadcn-ui@latest add dialog

# Tabs component
npx shadcn-ui@latest add tabs

# Alert component
npx shadcn-ui@latest add alert

# Toast/Sonner component
npx shadcn-ui@latest add sonner

# Skeleton component
npx shadcn-ui@latest add skeleton

# Pagination component (custom implementation below)
# No official pagination component yet

# Checkbox component
npx shadcn-ui@latest add checkbox

# Radio Group component
npx shadcn-ui@latest add radio-group

# Textarea component
npx shadcn-ui@latest add textarea

# Dropdown Menu component
npx shadcn-ui@latest add dropdown-menu
```

## Install Required Dependencies

```bash
npm install nodemailer @types/nodemailer
npm install pdfkit @types/pdfkit
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="YIWU EXPRESS <noreply@yiwuexpress.com>"

# App URL
APP_URL=http://localhost:3001
```

### Gmail Setup:
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate an app password for "Mail"
4. Use that password in SMTP_PASSWORD

## After Installation

1. Restart your development server
2. Test password reset functionality
3. Verify variant management works
4. Check email sending (check console logs if email fails)

## Verification

Run these checks:

```bash
# Check if components exist
ls components/ui/

# Should see:
# - form.tsx
# - table.tsx  
# - dialog.tsx
# - tabs.tsx
# - alert.tsx
# - checkbox.tsx
# - radio-group.tsx
# - textarea.tsx
# - dropdown-menu.tsx
# etc.
```

## Troubleshooting

### If shadcn commands fail:
```bash
# Initialize shadcn if needed
npx shadcn-ui@latest init

# Then try adding components again
```

### If email sending fails:
- Check SMTP credentials
- Check firewall/antivirus blocking port 587
- Try using different SMTP service (SendGrid, Mailgun, etc.)
- Check console logs for detailed error messages
